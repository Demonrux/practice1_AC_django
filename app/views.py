import json
from datetime import datetime
from django.shortcuts import render
from django.core.exceptions import ValidationError
import requests
from urllib.parse import unquote

API_URL = "http://127.0.0.1:8001/api/query"


def validate_id(search_id):
    if not search_id:
        raise ValidationError("Пожалуйста, введите ID")
    if not search_id.isdigit():
        raise ValidationError("ID должен содержать только цифры")
    if len(search_id) > 10:
        raise ValidationError("ID не может быть длиннее 10 цифр")
    if int(search_id) <= 0:
        raise ValidationError("ID должен быть положительным числом")
    return True


def validate_name(search_name):
    if not search_name:
        raise ValidationError("Пожалуйста, введите поисковый запрос")
    if len(search_name.strip()) < 2:
        raise ValidationError("Поисковый запрос должен содержать минимум 2 символа")
    if any(char in '<>{}[]' for char in search_name):
        raise ValidationError("Запрос содержит недопустимые символы")
    return True


def search_view(request):
    tables = [
        'alpha_cp_fp',
        'alpha_cp_fp_not_np',
        'alpha_cp_vp_kpm',
        'alpha_ind_fp',
        'alpha_ind_fp_not_np',
        'alpha_ind_gp_se',
        'alpha_ind_np',
        'alpha_is_ind_fp',
        'alpha_is_res_fp',
        'alpha_res_fp',
        'alpha_res_fp_not_np',
        'alpha_res_vp_kpm',
    ]

    if request.method == "POST":
        search_query = request.POST.get('search_query', '').strip()
        search_type = request.POST.get('search_type', 'id')
        selected_tables = request.POST.getlist('tables', tables)

        try:
            if search_type == 'id':
                validate_id(search_query)
                response = requests.get(
                    f"{API_URL}/by-id/{search_query}",
                    params={'alpha_table': ','.join(selected_tables)},
                    timeout=10
                )
            else:
                validate_name(search_query)
                decoded_query = unquote(search_query)
                response = requests.get(
                    f"{API_URL}/by-name/{decoded_query}",
                    params={'alpha_table': ','.join(selected_tables)},
                    timeout=100
                )

            response.raise_for_status()
            data = response.json()

            if 'data' not in data:
                raise ValidationError(f"Данные по запросу '{search_query}' не найдены")

            grouped_data = {}
            all_dates = set()
            has_empty_date = False

            for table_name, records in data['data'].items():
                if not records:
                    continue

                for record in records:
                    name = record.get('res_name') or record.get('ind_name')
                    if not name:
                        continue

                    date = record.get('date', 'Без даты')

                    realization_date = record.get('realization_date', '')
                    if realization_date:
                        try:
                            realization_date = str(datetime.fromtimestamp(int(realization_date) / 1000).year)
                        except (ValueError, TypeError):
                            realization_date = ''

                    if date != 'Без даты':
                        try:
                            dt = datetime.strptime(date, '%Y_%m_%d')
                            all_dates.add(dt)
                        except ValueError:
                            pass
                    else:
                        has_empty_date = True

                    grouped_data.setdefault(table_name, {}).setdefault(date, {}).setdefault(realization_date, []).append({
                        'num': record.get('num', '-'),
                        'fp_code': record.get('fp_code', '-'),
                        'res_id_value': record.get('res_id_value', '-'),
                        'res_name': record.get('res_name', '-'),
                        'cp_name': record.get('cp_name', '-'),
                        'ind_name': record.get('ind_name', '-'),
                        'date': date,
                        'realization_year': realization_date,
                        'source_table': table_name
                    })

            if not grouped_data:
                raise ValidationError(f"Данные по запросу '{search_query}' не найдены")

            sorted_dates = sorted(all_dates, reverse=True)
            date_strings = [dt.strftime('%Y_%m_%d') for dt in sorted_dates]
            if has_empty_date:
                date_strings.append('none')

            return render(request, 'app/results.html', {
                'id': search_query,
                'grouped_results': grouped_data,
                'search_query': search_query,
                'search_type': search_type,
                'all_dates': date_strings,
                'tables': tables
            })

        except ValidationError as error:
            return render(request, 'app/search.html', {
                'error': str(error),
                'search_query': search_query,
                'search_type': search_type,
                'tables': tables
            })
        except requests.exceptions.RequestException as e:
            error_msg = "Ошибка соединения с сервером"
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_msg = error_data.get('message', error_msg)
                except ValueError:
                    pass
            return render(request, 'app/search.html', {
                'error': error_msg,
                'search_query': search_query,
                'search_type': search_type,
                'tables': tables
            })
        except Exception as e:
            return render(request, 'app/search.html', {
                'error': f"Произошла ошибка: {str(e)}",
                'search_query': search_query,
                'search_type': search_type,
                'tables': tables
            })

    return render(request, 'app/search.html', {
        'tables': tables,
        'search_type': 'id'
    })