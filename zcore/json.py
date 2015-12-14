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

from .models import Graph, Node, Taxonomy, create_filtered_graph, render_content, print_json, pdev, to_main_graph
from .models import GFilterNodes, GFilterAttributes, GFilterZero, GFilterTaxonomy, GFilterNodeData, GIncludeNeighbors

HTMLPREFIX = '<!DOCTYPE html><meta charset="utf-8"><body>'
HTMLSUFFIX = '</body>'


# Преобразование графа для отображения основным способом - в виде графа
def json_main_graph(request, id, gfilter=None):
    graph = get_object_or_404(Graph, pk=id)
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
    graph = get_object_or_404(Graph, pk=id)
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"
    circular = to_circular(graph.body)
    response.write(circular)
    return response 


# Преобразование графа для отображения перемещений
def json_transfers(request, gid, nid, gfilter=None):
    graph = get_object_or_404(Graph, pk=gid)
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"

    data = {} # Объявляем словарь, в который будет записана вся необходимая для вывода графа информация
    data.update({'nodes':{}})
    H = json.loads(graph.body) # Декодируем json-объект - структуру графа
    G = json_graph.node_link_graph(H) # Преобразуем структуру графа в формате json в объект типа граф библиотеки NetworkX

    G = GFilterTaxonomy(G, {75: True}) # Отбираем узлы, включая их соседей, со значением id термина 75 - Событие: Перемещение
    nodes = G.nodes(data=True)
    for node in nodes:
        print(node)
        nid = node[0]
        data['nodes'][nid] = {
            'id': nid, 
            'data': G.node[nid]['data'], 
            #'degree': G.degree(nid),
            #'x':str(x),
            #'y':str(y), 
            #'taxonomy': G.node[nid]['taxonomy'],
            #'attributes': G.node[nid]['attributes'],
            #'neighbors': G.neighbors(nid),
        }

    data = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)
    response.write(data)
    return response 


# Для тестирования: визуализация графа по алгоритму force-direct
def json_force_d3(request, id, graphFilter, nodesList, color):
    graph = get_object_or_404(Graph, pk=id)

    props = graphFilter.split(';')
    print(props)

    filterOptions = {}
    filterOptions['zero'] = 'yes'


    graphData = json.loads(graph.body)
    G0 = json_graph.node_link_graph(graphData)

    numberOfNodes = G0.number_of_nodes()
    numberOfEdges = G0.number_of_edges()
    pdev('G.nodes %i, G.edges %i' % (numberOfNodes,numberOfEdges))

    #print(nodesList)
    # Если передан массив узлов графа filterNodes, производим фильтрацию узлов
    if len(nodesList) > 0:
        filterNodes = nodesList.split(',')
        #pdev('Производим фильтрацию по переданным в filterNodes узлам')
        nodesList = []
        for nid in filterNodes:
            if nid:
                nid = int(nid)
                print('nid>',nid)
                nodesList.append(nid)
                subs = nx.all_neighbors(G0, nid)
                for sub in subs:
                    nodesList.append(sub)
        G1 = G0.subgraph(nodesList)
    else:
        G1 = G0


    if 'zero' in props:
        print('zerono')
        # Если стоит фильтр на одиночные вершины - убираем их из графа
        nodes = G1.nodes()
        for node in nodes:
            #print('node %i - degree %i' % (node,G1.degree(node)))
            if G1.degree(node) < 1:
                G1.remove_node(node)

    if 'radius' in props:
        print('radiusattributes')
        # Добавлям кол-во атрибутов узла отфильтрованного графа в качестве атрибута numberOfAttributes
        for node in G1.nodes(data=True):
            numberOfAttributes = len(node[1]['attributes'][0])
            G1.add_node(node[0], radius=numberOfAttributes)
    else:
        print('radiusdegree')
        # Добавлям значеие веса узлов отфильтрованного графа в качестве атрибута degree
        for node in G1.nodes():
            G1.add_node(node, radius=G1.degree(node))


    # Добавлям значеие веса узлов отфильтрованного графа в качестве атрибута degree
    for node in G1.nodes():
        G1.add_node(node, degree=G1.degree(node))

    data = json_graph.node_link_data(G1)

    numberOfNodes = G1.number_of_nodes()
    data['graph'].append({'numberOfNodes': numberOfNodes})

    numberOfEdges = G1.number_of_edges()
    data['graph'].append({'numberOfEdges': numberOfEdges})

    #data = G0data
    result = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)
    #result=graph.body

    content = result
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"
    response.write(content)

    return response 


# Визуализация графа по алгоритму force-direct
def json_force_react(request, id, gfilter):
    try: 
        # Преобразуем в объект json-массив параметров, полученных из url 
        gfilter = json.loads(gfilter)
        print_json(gfilter)
    except:
        returnErrorMessage('Неправильный json-массив graphFilter')
        raise

    graph = get_object_or_404(Graph, pk=id)
    graphData = json.loads(graph.body)
    G = json_graph.node_link_graph(graphData)

    try:
        # Исключаем из графа узлы с нулевым весом (без связей)
        G = GFilterZero(G, gfilter['options']['zero'])
    except: pass

    try:
        # Производим фильтрацию графа по переданным в списке nodes узлам
        G = GFilterNodes(G,gfilter['nodes'])
    except: pass

    try:
        # Производим фильтрацию узлов графа по переданным в ассоциативном массивe attributes атрибутам узлов
        G = GFilterAttributes(G,gfilter['attributes'])
    except: pass

    # Добавлям кол-во атрибутов узла отфильтрованного графа в качестве атрибута numberOfAttributes
    for node in G.nodes(data=True):
        numberOfAttributes = len(node[1]['attributes'][0])
        G.add_node(node[0], numberOfAttributes=numberOfAttributes)

    # Добавлям значеие веса узлов отфильтрованного графа в качестве атрибута degree
    for nid in G.nodes():
        G.add_node(nid, degree=G.degree(nid))

    data = json_graph.node_link_data(G)

    # Добавляем значение кол-ва узлов в представление графа
    numberOfNodes = G.number_of_nodes()
    data['graph'].append({'numberOfNodes': numberOfNodes})

    # Добавляем значение кол-ва дуг в представление графа
    numberOfEdges = G.number_of_edges()
    data['graph'].append({'numberOfEdges': numberOfEdges})

    # Вывод отладочной информации
    pdev('G.nodes %i, G.edges %i' % (numberOfNodes,numberOfEdges))

    content = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"
    response.write(content)
    return response 


# Визуализация графа методом круговой диаграмы с использование библиотеки d3js
def json_chord(request, id, gfilter):
    try: 
        # Преобразуем в объект json-массив параметров, полученных из url 
        gfilter = json.loads(gfilter)
        print_json(gfilter)
    except: returnErrorMessage('Неправильный json-массив gfilter')

    graph = get_object_or_404(Graph, pk=id)
    graphData = json.loads(graph.body)

    #
    #
    # Блок работы с данными в графовом представлении
    G = json_graph.node_link_graph(graphData)

    try:
        # Исключаем из графа узлы с нулевым весом (без связей)
        G = GFilterZero(G, gfilter['options']['rmzero'])
    except: pass

    try:
        # Производим фильтрацию графа по переданным в списке nodes узлам
        G = GFilterNodes(G,gfilter['nodes'])
    except: pass

    try:
        # Производим фильтрацию узлов графа по переданным в ассоциативном массивe attributes атрибутам узлов
        G = GFilterAttributes(G,gfilter['attributes'])
    except: pass
    # /Блок работы с данными в графовом представлении
    #
    #
        
    # Экспортируем данные графа NetworkX в простое текстовое представление в формате json
    gdata = json_graph.node_link_data(G)
    #gdata = graphData

    # Формируем квадратичную матрицу для вывода методом круговой диаграммы
    msize = G.number_of_nodes()
    M = np.zeros([msize,msize], dtype=int)
    for link in gdata['links']:
        r = link['source']
        c = link['target']

        # Добавляем случайное значение в качестве числового значения дуги 
        # так как в предоставленной "семантической куче" такие данные пока отсутствуют
        v = randint(1,10)

        M[r][c] = v

    # Добавляем полученноую матрицу в json-представление графа
    m = M.tolist()
    gdata.update({"matrix": m})

    # Добавляем значение кол-ва узлов и дуг в представление графа
    numberOfNodes = G.number_of_nodes()
    numberOfEdges = G.number_of_edges()

    if type(gdata['graph']) is dict:
        gdata['graph'].update({'numberOfNodes': numberOfNodes, 'numberOfEdges': numberOfEdges})
    elif type(gdata['graph']) is list:
        gdata['graph'].append({'numberOfNodes': numberOfNodes, 'numberOfEdges': numberOfEdges})


    # Вывод отладочной информации
    pdev('G.nodes %i, G.edges %i' % (numberOfNodes,numberOfEdges))

    #J = json_graph.node_link_data(G)
    content = json.dumps(gdata, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)
    #content = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '))
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"
    response.write(content)
    return response 


# Визуализация графа с выявлением многомерного тренда
def json_timeline(request, id, gfilter):
    try: 
        # Преобразуем в объект json-массив параметров, полученных из url 
        gfilter = json.loads(gfilter)
        print_json(gfilter)
    except: returnErrorMessage('Неправильный json-массив gfilter')

    graph = get_object_or_404(Graph, pk=id)
    graphData = json.loads(graph.body)

    #
    #
    # Блок работы с данными в графовом представлении
    G = json_graph.node_link_graph(graphData)
    try:
        # Исключаем из графа узлы с нулевым весом (без связей)
        G = GFilterZero(G, gfilter['options']['rmzero'])
    except: pass
    try:
        # Производим фильтрацию графа по переданным в списке nodes узлам
        G = GFilterNodes(G,gfilter['nodes'])
    except: pass
    try:
        # Производим фильтрацию узлов графа по переданным в ассоциативном массивe attributes атрибутам узлов
        G = GFilterAttributes(G,gfilter['attributes'])
    except: pass
    # Добавляем сгенированную информацию о перемещениях объекта
    # это необходимо пока отсутствуют реальные данные
    try:
        # Производим фильтрацию узлов графа по переданным в ассоциативном массивe attributes атрибутам узлов
        G = GFilterTransfers(G)
    except: pass
    # /Блок работы с данными в графовом представлении
    #
    #
        
    # Экспортируем данные графа NetworkX в простое текстовое представление в формате json
    gdata = json_graph.node_link_data(G)
    #gdata = graphData

    # Добавляем значение кол-ва узлов и дуг в представление графа
    numberOfNodes = G.number_of_nodes()
    numberOfEdges = G.number_of_edges()
    if type(gdata['graph']) is dict:
        gdata['graph'].update({'numberOfNodes': numberOfNodes, 'numberOfEdges': numberOfEdges})
    elif type(gdata['graph']) is list:
        gdata['graph'].append({'numberOfNodes': numberOfNodes, 'numberOfEdges': numberOfEdges})

    # Вывод отладочной информации
    pdev('G.nodes %i, G.edges %i' % (numberOfNodes,numberOfEdges))

    #J = json_graph.node_link_data(G)
    content = json.dumps(gdata, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)
    #content = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '))
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"
    response.write(content)
    return response 


# Получаем словарь атрибутов в формате json
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


# Получаем словарь типов информационных объектов в древовидной форме с учётом вложенности в формате json
# для вывода элементов интерфейса с использование библиотеки Cement обязательно наличие ключей:
# value, display, checked
def json_taxonomy(request):
    """
    устаревший код, требует повторного пересмотра и, возможно, удаления
    cursor = connections['mysql'].cursor()
    sql = "SELECT id, parent_id, name FROM taxonomy WHERE facet_id=1"

    # Выполняем sql-запрос
    cursor.execute(sql)

    # Получаем массив значений результата sql-запроса в виде словаря:
    # "ключ": "значение". Это необходимо для преоразования в json-формат
    attributes = dictfetchall(cursor)
    data = []
    initValues = [1,2,6]
    for attribute in attributes:
        id = int(attribute['id'])
        name = attribute['name']
        parent_id = attribute['parent_id']

        if id in initValues:
            checked = True
        else:
            checked = False
        data.append({'value': id, 'parent_tid': parent_id, 'display': name, 'checked': checked})
    """

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


