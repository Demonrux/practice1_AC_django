import pandas as pd
import sys
import json
from sqlalchemy import create_engine
from sqlalchemy import text

import os

from traceback import format_exc

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

alpha_query = FastAPI()

alpha_query.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

DB_IP = None
DB_PORT = None
DB_USER = None
DB_PASSWORD = None
DB_NAME = 'alpha'

# Your list of tables
TABLES = ['tables'
                ]

# Corresponding fields in tables for searching by id
ID_COLUMNS = {
    'tables': 'id'
    }

# Corresponding fields in tables for searching by keywords
NAME_COLUMNS = {
    'tables': ['name']
}


@alpha_query.get('/api/query/by-id/{id}')
async def alpha_query_id(id: str, alpha_table: str | None = None) -> JSONResponse:
    if alpha_table is not None:
        alpha_tables = [t.strip() for t in alpha_table.split(',') if t.strip() in TABLES]
        if not alpha_tables:
            return JSONResponse(
                status_code=400,
                content={'message': 'Некорректный список таблиц. Доступные таблицы: ' + ', '.join(TABLES)}
            )
    else:
        tables = TABLES

    try:
        response = {}
        connection = create_engine(f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_IP}:{DB_PORT}/{DB_NAME}')

        for table in tables:
            query = text(f'SELECT * FROM {table} WHERE {ID_COLUMNS[table]} = :id')
            records = pd.read_sql(query, connection, params={'id': id})

            if not records.empty:
                response[table] = json.loads(records.to_json(orient='records', force_ascii=False))

        if not response:
            return JSONResponse(
                status_code=404,
                content={'message': f'Данные по ID {id} не найдены в выбранных таблицах'}
            )

        return JSONResponse(
            status_code=200,
            content={
                'data': response,
                'searched_tables': tables,
                'total_tables_searched': len(tables)
            }
        )

    except Exception as error:
        return JSONResponse(
            status_code=500,
            content={
                'message': 'Внутренняя ошибка сервера',
                'error': str(error),
                'traceback': format_exc(),
                'requested_tables': tables
            }
        )


@alpha_query.get('/api/query/by-name/{name}')
async def alpha_query_name(name: str, table: str | None = None) -> JSONResponse:
    if len(name) < 2:
        return JSONResponse(
            status_code=400,
            content={'message': 'Поисковый запрос должен содержать минимум 2 символа'}
        )

    if table is not None:
        alpha_tables = [t.strip() for t in table.split(',') if t.strip() in TABLES]
        if not alpha_tables:
            return JSONResponse(
                status_code=400,
                content={'message': 'Некорректный список таблиц. Доступные таблицы: ' + ', '.join(TABLES)}
            )
    else:
        tables = TABLES

    try:
        response = {}
        connection = create_engine(f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_IP}:{DB_PORT}/{DB_NAME}')

        for table in tables:
            columns = NAME_COLUMNS.get(table, [])
            if not columns:
                continue

            conditions = " OR ".join([f"{col} ILIKE :param" for col in columns])
            query = text(f"SELECT * FROM {table} WHERE {conditions}")
            params = {"param": f"%{name}%"}

            records = pd.read_sql(query, connection, params=params)

            if not records.empty:
                response[table] = json.loads(records.to_json(orient='records', force_ascii=False))

        if not response:
            return JSONResponse(
                status_code=404,
                content={
                    'message': f'Данные по запросу "{name}" не найдены',
                    'searched_tables': tables
                }
            )

        return JSONResponse(
            status_code=200,
            content={
                'data': response,
                'searched_tables': tables,
                'total_matches': sum(len(v) for v in response.values())
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                'message': 'Внутренняя ошибка сервера',
                'error': str(e),
                'traceback': format_exc(),
                'requested_tables': tables
            }
        )


print(os.environ['AUTH_FILE'])
credentials = open(os.environ['AUTH_FILE']).read().split('\n')
DB_IP, DB_PORT, DB_USER, DB_PASSWORD = credentials[0], credentials[1], credentials[2], credentials[3]
