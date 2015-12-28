# -*- coding: utf-8 -*-
import json
#import jsonurl
import math
import networkx as nx
from networkx.readwrite import json_graph
from random import randint
import numpy as np
#from numpy import array
import warnings
#import pygraphviz
#import pydot

from django.shortcuts import get_object_or_404, render
from django.http import HttpResponse, HttpResponseRedirect
from django.db import connections

from rest_framework.views import APIView
from rest_framework.response import Response

from .models import *
from .zgraph import *
from .zdb import *

HTMLPREFIX = '<!DOCTYPE html><meta charset="utf-8"><body>'
HTMLSUFFIX = '</body>'


#
#
# Связывание http-запросов с соответствующими им программными функциями

#  Привязка к шаблону отображения главной страницы index.html
def index(request):
    graphs = StorageGraph.objects.order_by('-pk')    
    graph = StorageGraph()
    context = {'graph': graph, 'graphs': graphs}
    return render(request, 'zcore/index.html', context)


# Привязка к шаблону отображения создания нового проекта
def create_project(request, graphFilter):
    # Создание графа - многомерной проекции "семантической кучи" - с заданными атрибутами узлов
    data = create_filtered_graph(graphFilter)

    #content = {'content': data}
    #return render(request, 'content.html', content)
    return HttpResponseRedirect('/') # Переадресуем на главную страницу
    #return True


# Привязка к шаблону отображения графа в виде круговой диаграммы
def view_chord(request, id):
    graph = get_object_or_404(StorageGraph, pk=id)
    context = {'graph': graph}
    return render(request, 'zcore/chord.html', context)


# Привязка к шаблону отображения данных на карте
def view_map(request, gid, nid):
    graph = get_object_or_404(StorageGraph, pk=gid)
    context = {'graph': graph, 'nid': nid}
    return render(request, 'zcore/map.html', context)


# Привязка к шаблону отображения создания нового проекта
def view_new_project(request):
    context = ''
    return render(request, 'zcore/new-project.html', context)


# Привязка к шаблону отображения данных в виде графа - основной вид
def view_graph(request, id):
    graph = get_object_or_404(StorageGraph, pk=id)
    context = {'graph': graph}
    return render(request, 'zcore/graph.html', context)


# Привязка к шаблону отображения графа в виде временной гистограммы
def view_timeline(request, id):
    graph = get_object_or_404(StorageGraph, pk=id)
    context = {'graph': graph}
    return render(request, 'zcore/timeline.html', context)


# Для отладки: привязка к шаблону отображения графа методом force
def view_force_react(request, id, graphFilter):
    graph = get_object_or_404(StorageGraph, pk=id)
    #print(graphFilter)
    #jsonurl.query_string(graphFilter)
    context = {'filter': graphFilter, 'graph': graph}
    return render(request, 'zcore/force-react.html', context)


# Привязка к шаблону отображения графа методом force средствами библиотеки D3js
def view_force_d3(request, id, graphFilter, nodesList, color):
    graph = get_object_or_404(StorageGraph, pk=id)
    context = {'graph': graph, 'filter': graphFilter, 'nodes': nodesList, 'color': color}
    return render(request, 'zcore/force-d3.html', context)


# привязки http-запросов:

# Преобразование графа для отображения основным способом - в виде графа
def json_main_graph(request, id, gfilter=None):
    graph = get_object_or_404(StorageGraph, pk=id)
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"
    if gfilter and gfilter != 'undefined':
        data = to_main_graph(graph.body, gfilter)
    else:
        data = graph.layout_spring
    response.write(data)
    return response 


# Преобразование графа для вывода по алгоритму circular
def json_circular(request, id):
    graph = get_object_or_404(StorageGraph, pk=id)
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"
    circular = to_circular(graph.body)
    response.write(circular)
    return response 


# Получаем словарь типов информационных объектов в древовидной форме с учётом вложенности в формате json
# для вывода элементов интерфейса с использование библиотеки Cement обязательно наличие ключей:
# value, display, checked
def json_taxonomy(request):
    # Инициализируем объект таксономии и получаем структуру всей таксономии многомерной проекции
    t = Taxonomy()
    data = t.get_taxonomy()

    # Преобразуем данные в json-формат
    content = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)

    # Создаём объект response для динамического создания html-страницы
    response = HttpResponse() 

    # Объявляем основные мета-данные html-страницы
    response['Content-Type'] = "text/javascript; charset=utf-8" 

    # Записываем в объкт response полученную структуру графа в json-формате
    #response.write(HTMLPREFIX+content+HTMLSUFFIX) 
    response.write(content)

    # возвращаем все необходимые фреймворку Django данные для окончательной генерации html-страницы
    return response 
    #return HttpResponse("Here's the text of the Web page.")


# /Связывание http-запросов с соответствующими им программными функциями
#
#


# Получение словарь атрибутов информационных объектов в формате json
def json_attributes(request):
    cursor = connections['mysql'].cursor()
    sql = "SELECT id, name FROM property"

    # Выполняем sql-запрос
    cursor.execute(sql)

    # Получаем массив значений результата sql-запроса в виде словаря:
    # "ключ": "значение". Это необходимо для преоразования в json-формат
    attributes = dictfetchall(cursor)
    data = []
    initValues = [10, 20, 30, 40, 50, 60, 70]
    for attribute in attributes:
        value = attribute['id']
        if value in initValues:
            checked = True
        else:
            checked = False
        display = attribute['name']
        data.append({'value': value, 'display': display, 'checked': checked})

    # Преобразуем данные в json-формат
    content = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)

    # Создаём объект response для динамического создания html-страницы
    response = HttpResponse() 

    # Объявляем основные мета-данные html-страницы
    response['Content-Type'] = "text/javascript; charset=utf-8" 

    # Записываем в объкт response полученную структуру графа в json-формате
    response.write(content) 

    # возвращаем все необходимые фреймворку Django данные для окончательной генерации html-страницы
    return response 


# Получение общей информации об исходных связанных данных 
class HeapInfo(APIView):

    def get(self, request):
        cursor = connections['mysql'].cursor() # Устанавливаем соединения с базой данных 'mysql'
        sql = "SELECT count(id) as nodes FROM element WHERE is_entity=1"
        cursor.execute(sql) # Выполняем sql-запрос
        nodes = cursor.fetchall()[0][0]

        sql = "SELECT count(id) as edges FROM element WHERE is_entity=0"
        cursor.execute(sql) # Выполняем sql-запрос
        edges = cursor.fetchall()[0][0]

        objects = nodes + edges

        data = {'objects': objects, 'nodes': nodes, 'edges': edges}

        return responseJSON(data)

