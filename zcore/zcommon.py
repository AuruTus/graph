# -*- coding: utf-8 -*-
import json
import math

from django.http import HttpResponse, HttpResponseRedirect


# Возвращает все строки объката cursor sql-запроса в виде словаря
def dictfetchall(cursor):
    desc = cursor.description
    return [
        dict(zip([col[0] for col in desc], row))
        for row in cursor.fetchall()
    ]
 

# Преобразование вложенных списков в одномерный массив
def flatlist(list_of_lists):
    flattened = []
    for sublist in list_of_lists:
        for val in sublist:
                flattened.append(val)
    return flattened


# Обработка вывода сообщения об ошибке
def returnErrorMessage(message):
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"
    print(message)
    response.write(message)
    return response 


# Функция которая получает на вход словарь где: ключ = int, значение = bool;
# и возвращает список только тех элементов, где значение True
def flatten_int_by_true(d):
    if len(d) > 0:
        l = []
        for obj in d:
            if d[obj]:
                l.append(int(obj))
    return l


# Функция для вывода отладочной информации
def pdev(str):
    print('\n',str,'\n')
    return True


# Форматирование данных в формате json при выводе
def print_json(data):
    print(json.dumps(data, indent=4, sort_keys=True, ensure_ascii=False))


# Вывод сформированных данных для отладочных целей 
def render_content(content):
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"
    print(content)
    response.write(content)
    return response 


