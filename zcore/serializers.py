# -*- coding: utf-8 -*-
import json
import math
import networkx as nx
from networkx.readwrite import json_graph
from random import randint
import numpy as np
import warnings
import requests

from django.db import models
from django.db import connections
from django.http import HttpResponse, HttpResponseRedirect
from django.forms import widgets
from django.contrib.auth.models import User
from rest_framework import serializers

from .zgraph import *


# Получение способа компоновки средствами библиотеки NetworkX; способ может меняться на основе параметра, выбранного пользователем
def get_graph_layout(G, argument):
    switcher = {
        'spring': nx.spring_layout(G,scale=0.9),
        'shell': nx.shell_layout(G,scale=0.9),
        'random': nx.random_layout(G),
    }
    #layout = nx.spectral_layout(G,scale=0.7)
    #layout = nx.graphviz_layout(G,prog='neato')
    func = switcher.get(argument, nx.spring_layout(G,scale=0.4))
    return func


# Формирование модели данных для их дальнейшей визуализации в виде графа: обработка и фильтрация графа; формирование и добавление данных, не рассчитываемых на этапе создания способа компоновки, но необходимых для визуализации в нашем конкретном случае.
def to_main_graph(body, gfilter=None):
    data = {} # Объявляем словарь, в который будет записана вся необходимая для вывода графа информация
    H = json.loads(body) # Декодируем json-объект - структуру графа
    BG = json_graph.node_link_graph(H) # Преобразуем структура графа в формате json в объект типа граф библиотеки NetworkX
    FG = json_graph.node_link_graph(H) # Инициализируем граф для последовательной фильтрации

    # Если передан массив фильтрующих атрибутов, 
    # декодируем json-объект gfilter - массив параметров, полученных из url 
    # и производим фильтрацию в соответствии с полученными данными:
    layoutArgument = ''
    try: 
        gfilter = json.loads(gfilter) # Получаем ассоциативный массив данных фильтра в формате json 
        print_json(gfilter) # отладочная информация
        #print('FGin',FG.nodes())
        FG = GFilterNodeData(FG, BG, gfilter.get('data')) # Оставляем в графе только те узлы, атрибут data которых совпадает с переданной строкой
        FG = GFilterTaxonomy(FG, BG, gfilter.get('taxonomy')) # Производим фильтрацию узлов графа по переданному массиву терминов таксономии
        #print('FG1',FG.nodes())
        #G = GFilterAttributes(FG, gfilter.get('attributes')) # Производим фильтрацию графа по атрибутам узла
        FG = GFilterNodes(FG, gfilter.get('nodes')) # Производим фильтрацию графа по переданным в списке nodes узлам
        FG = GIncludeNeighbors(FG, BG, int(gfilter.get('depth'))) # Включаем в граф соседей для текущих узлов
        FG = GJoinPersons(FG, gfilter.get('joinPersons')) # Объединяем узлы типа Персона по значению атрибута Фамилия
        #print('FG2',FG.nodes())
        layoutArgument = gfilter.get('layout') # Получаем значение выбранного способа компоновки (layout)
        #print('FGout',FG.nodes())
    except:
        warnings.warn('Ошибка при обработке json-массива gfilter', UserWarning)
        #raise
    layout = get_graph_layout(FG, layoutArgument)
    #layout = nx.random_layout(G),
    #nodes = G.nodes(data=True)
    nodes = FG.nodes()
    #data = {'nodes':[], 'links':[]}
    data.update({'nodes':{}})
    #e = nx.edges(G)
    #e = G.edges()
    #links = {'links': e}
    #data.update(links)
    maxx,maxy,minx,miny,averagex,averagey,diffx,diffy = 0,0,0,0,0,0,0,0
    averageScale,scale = 1,1
    for nid in layout:
        point = layout.get(nid)
        x = point[0]
        y = point[1]

        # Вычисляем максимальные, минимальные и средние значения
        maxx = x if x > maxx else maxx
        maxy = y if y > maxy else maxy
        minx = x if x < minx else minx
        miny = y if y < miny else miny
        averagex = maxx - (math.fabs(maxx) + math.fabs(minx)) / 2
        averagey = maxy - (math.fabs(maxy) + math.fabs(miny)) / 2
        diffx = math.fabs(maxx) + math.fabs(minx)
        diffy = math.fabs(maxy) + math.fabs(miny)
        scale = diffx if diffx > diffy else diffy
        if scale != 0:
            averageScale = 0.8 / scale

        data['nodes'][nid] = {
            'id': nid, 
            'data': FG.node[nid]['data'], 
            'degree': FG.degree(nid),
            'x':str(x),
            'y':str(y), 
            'taxonomy': FG.node[nid]['taxonomy'],
            'attributes': FG.node[nid]['attributes'],
            'neighbors': FG.neighbors(nid),
        }
    data.update({'maxx': str(maxx), 'maxy': str(maxy), 'minx': str(minx), 'miny': str(miny)})
    data.update({'averagex': averagex, 'averagey': averagey, 'averageScale': averageScale})
    data.update({'diffx': diffx, 'diffy': diffy})
    data = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)
    return data


# Преобразование входного массива данных в формат JSON c использованием объекта django.http.HttpResponse 
def responseJSON(data):
    try:
        # Преобразуем переданные данные в формат json
        jsonContent = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)

        # Создаём объект response для динамического создания html-страницы
        response = HttpResponse() 

        # Объявляем основные мета-данные html-страницы
        response['Content-Type'] = "text/javascript; charset=utf-8" 

        # Записываем в объкт response полученную структуру графа в json-формате
        response.write(jsonContent) 

        responseJSON = response

    except:
        print('Неправильный формат данных для преобразования в json-формат')
        responseJSON = False

    return responseJSON


countries = "Австрия, Андорра, Албания, Беларусь, Бельгия, Болгария, Босния и Герцеговина, Ватикан, Великобритания, Венгрия, Германия, Гибралтар, Греция, Дания, Ирландия, Исландия, Испания, Италия, Латвия, Литва, Лихтенштейн, Люксембург, Македония, Мальта, Молдавия, Монако, Нидерланды, Норвегия, Польша, Португалия, Россия, Румыния, Сан-Марино, Сербия и Черногория, Словакия, Словения, Украина, Фарерские острова, Финляндия, Франция, Хорватия, Черногория, Чехия, Швейцария, Швеция"
trash = countries.split(', ')


# Преобразование данных, полученных путем sql-запроса и представленных в виде словаря, 
# в формат ключ: значение 
def dictfetchall(cursor):
    desc = cursor.description
    return [
        dict(zip([col[0] for col in desc], row))
        for row in cursor.fetchall()
    ]

# Для отладки: создание Петерсон-графа
def make_petersen(request):
    P = nx.petersen_graph()
    graph = Graph()
    graph.title = 'граф Петерсена'
    data = json_graph.node_link_data(P)

    nodes = data['nodes']
    for node in nodes:
        title = 'this is ' + str(node['id'])
        attribute = 'my attr is ' + str(randint(1,10))
        node.update({'title': title, 'attribute': attribute})
    #data['nodes'] = nodes

    graph.body = json.dumps(data, ensure_ascii=False)
    graph.save()

    #return HttpResponseRedirect('/admin/zcore/graph/' + str(graph.id))
    return HttpResponseRedirect('/')


# Для отладки: создание древовидного графа
def make_balanced_tree(request):
    n,m = 3,5
    G = nx.balanced_tree(n,m)
    data = json_graph.node_link_data(G)

    graph = Graph()
    graph.title = "Balanced tree %s-%s" % (n, m)
    graph.body = json.dumps(data, ensure_ascii=False)
    graph.save()

    return HttpResponseRedirect('/zcore/')


# Для отладки: создание разнообразных графов средствами библиотеки NetworkX
def make_random(request):
    #maxn,maxe = 3, 4
    maxn,maxe = 20, 40
    n = randint(10,maxn)
    e = randint(20,maxe)
    methods = [
        'lollipop_graph',
        'dense_gnm_random_graph',
        'gnp_random_graph', 
        'fast_gnp_random_graph',

        #'erdos_renyi_graph',
        #'binomial_graph',
        #'random_regular_graph',
        #'barabasi_albert_graph',
        #'grid_2d_graph',
    ]
    i = randint(0,len(methods)-1)
    random = eval('nx.'+methods[i])(n,e)
    data = json_graph.node_link_data(random)

    graph = Graph()
    graph.title = methods[i]
    graph.body = json.dumps(data, ensure_ascii=False)
    graph.save()

    return HttpResponseRedirect('/')


# Для отладки: формирование модели данных для визуализации методом кругового распределения узлов
def to_circular(body):
    H = json.loads(body)
    G = json_graph.node_link_graph(H)
    circular = nx.circular_layout(G)

    data = {'nodes':[], 'links':[]}
    for k in circular:
        point = circular.get(k)
        x = str(point[0])
        y = str(point[1])
        data['nodes'].append({'x':x,'y':y})

    e = nx.edges(G)
    links = {'links': e}
    data.update(links)

    data.update({'numberOfNodes':nx.number_of_nodes(G)})
    data.update({'numberOfEdges':nx.number_of_edges(G)})

    data = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)

    return data


# Для отладки: вывод поля body без преобразований
def to_plane_graph(body):
    H = json.loads(body)
    data = json.dumps(H, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)
    return data


# Для отладки: формирование модели данных для их дальнейшей визуализации методом force-direct средствами библиотеки d3js 
def to_force(body, graphFilter, removeStandalone=True):
    #attributes_filter = ['last_name', 'first_name']
    H = json.loads(body)
    G = json_graph.node_link_graph(H)
    N = nx.Graph()
    F = nx.Graph()
    filterBunch = []
    rsBunch = []

    nodes = G.nodes(data=True)
    for node in nodes:
        #print('\n',node[1]['data'],'\n')
        attributes = node[1]['attributes']
        for attribute in attributes:
            if attribute['val'] in graphFilter:
                filterBunch.append(node[0])
                print(node[0])
                print(attribute['val'],'\n')
                if G.degree(node[0]):
                    rsBunch.append(node[0])

    #data = {'nodes':[], 'links':[]}
    for node in H['nodes']:
        if 'title' in node:
            title = str(node['title'])
        else:
            title = 'node_' + str(node['id'])
        if 'attributes' in node:
            attributes = node['attributes']
        else:
            attributes = 'node_' + str(node['id'])
        node_attributes = 1
        #if node_attributes in attributes['val']:
        #print(node['id'])
        if G.degree(node['id']):
            rsBunch.append(node['id'])
            #print(G.degree(node['id']))
            #N.add_node(node['id'], title=title, attributes=attributes)
        #data['nodes'].append({'title': title, 'attributes': attributes})

    #for link in H['links']:
        #data['links'].append({'source': link['source'], 'target': link['target'], 'title': randint(1,30)})

    F = G.subgraph(filterBunch)
    N = G.subgraph(rsBunch)

    if removeStandalone:
        data = json_graph.node_link_data(N)
    else:
        data = json_graph.node_link_data(F)

    result = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)

    return result


# Формирование модели данных для их дальнейшей визуализации в виде круговой диаграммы
def to_chord(body):
    H = json.loads(body)
    msize = len(H['nodes'])
    M = np.zeros([msize,msize], dtype=int)

    data = {'nodes':[], 'links':[], 'matrix':''}

    for link in H['links']:
        r = link['source']
        c = link['target']
        v = randint(1,10)
        M[r][c] = v
        data['links'].append({'source': r, 'target': c, 'value': v})
    m = M.tolist()
    data['matrix'] = m

    rr = []
    counter = 0
    for node in H['nodes']:
        id = node['id']
        while True:
            r = randint(0,len(trash)-1)
            if r not in rr:
                rr.append(r)
                break
        label = trash[r]
        values = {'id': id, 'label': label}
        data['nodes'].insert(id, values)
        counter += 1
        if counter > len(trash)-1:
            rr = []

    data = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)
    return data


# Вспомогательная фу-я для визуализации методом многомерного тренда
def GFilterTransfers(G):
    # Если check=true, производим фильтрацию узлов
    nodes = G.nodes(data=True)
    for node in nodes:
        nid = int(node[0])

        doit = 0
        attributes = G.node[nid]['attributes']
        for attribute in attributes:
            if attribute['name'] == 'Фамилия':
                doit = 1

        if doit == 1:
            G.node[nid]['class_id'] = 1
            G.node[nid]['transfers'] = []
            months = [1,2,3,4,5,6,7,8,9,10]
            transfersInYear = 0
            for month in months:
                transfersInMonth = randint(1,4)
                G.node[nid]['transfers'].append({'month': month, 'number': transfersInMonth})
                transfersInYear = transfersInYear + transfersInMonth
            doit = 0
            G.node[nid]['transfersNumber'] = transfersInYear
        else:
            G.node[nid]['class_id'] = 0

        #print("======================================================")
        #print("G",nid,": ",G.node[1]['transfers'])

    return G


#
#
# json-data Данные в формате json

# Формирование модели данных для их дальнейшей визуализации на географической карте с использованием библиотеки Leaflet.js
def json_transfers(request, gid, nid, gfilter=None):
    graph = get_object_or_404(StorageGraph, pk=gid)
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"

    data = {} # Объявляем словарь, в который будет записана вся необходимая для вывода графа информация
    data.update({'nodes':{}})
    H = json.loads(graph.body) # Декодируем json-объект - структуру графа
    BG = json_graph.node_link_graph(H) # Преобразуем структура графа в формате json в объект типа граф библиотеки NetworkX
    FG = json_graph.node_link_graph(H) # Инициализируем граф для последовательной фильтрации

    taxonomy = {75: True} # Отбираем узлы, включая их соседей, со значением id термина 75 - Событие: Перемещение
    FG = GFilterTaxonomy(FG, BG, taxonomy) # Производим фильтрацию узлов графа по переданному массиву терминов таксономии
    nodes = FG.nodes(data=True)
    for node in nodes:
        print(node)
        nid = node[0]
        data['nodes'][nid] = {
            'id': nid, 
            'data': FG.node[nid]['data'], 
            #'degree': FG.degree(nid),
            #'x':str(x),
            #'y':str(y), 
            #'taxonomy': FG.node[nid]['taxonomy'],
            #'attributes': FG.node[nid]['attributes'],
            #'neighbors': FG.neighbors(nid),
        }

    data = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)
    response.write(data)
    return response 


# Для отладки: визуализация графа по алгоритму force-direct с использованием библиотеки d3js
def json_force_d3(request, id, graphFilter, nodesList, color):
    graph = get_object_or_404(StorageGraph, pk=id)

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


# Для отладки: визуализация графа по алгоритму force-direct
def json_force_react(request, id, gfilter):
    try: 
        # Преобразуем в объект json-массив параметров, полученных из url 
        gfilter = json.loads(gfilter)
        print_json(gfilter)
    except:
        returnErrorMessage('Неправильный json-массив graphFilter')
        raise

    graph = get_object_or_404(StorageGraph, pk=id)
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

    graph = get_object_or_404(StorageGraph, pk=id)
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


# Формирование модели данных для их дальнейшей визуализации в виде многомерного тренда на примере отображения кол-ва перемещений как за выбранный месяц, так и за выбранный период
def json_timeline(request, id, gfilter):
    try: 
        # Преобразуем в объект json-массив параметров, полученных из url 
        gfilter = json.loads(gfilter)
        print_json(gfilter)
    except: returnErrorMessage('Неправильный json-массив gfilter')

    graph = get_object_or_404(StorageGraph, pk=id)
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


