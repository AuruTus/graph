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

from .json import *
from .models import Graph, Node, Taxonomy, create_filtered_graph, render_content, print_json, pdev, to_main_graph
from .models import GFilterNodes, GFilterAttributes, GFilterZero, GFilterTaxonomy, GFilterNodeData, GIncludeNeighbors


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


# Обработка вывода сообщения об ошибке
def returnErrorMessage(message):
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"
    print(message)
    response.write(message)
    return response 


# Преобразование вложенных списков в одномерный массив
def flatlist(list_of_lists):
    flattened = []
    for sublist in list_of_lists:
        for val in sublist:
                flattened.append(val)
    return flattened


# Преобразование данных, полученных путем sql-запроса и представленных в виде словаря, 
# в формат ключ: значение 
def dictfetchall(cursor):
    desc = cursor.description
    return [
        dict(zip([col[0] for col in desc], row))
        for row in cursor.fetchall()
    ]

# Подготока данных и вызов рендеринга шаблона вывода index.html
def index(request):
    graphs = Graph.objects.order_by('-pk')    
    graph = Graph()
    context = {'graph': graph, 'graphs': graphs}
    return render(request, 'zcore/index.html', context)


# Для тестовых целей: создание Петерсон-графа
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


# Для тестовых целей: создание древовидного графа
def make_balanced_tree(request):
    n,m = 3,5
    G = nx.balanced_tree(n,m)
    data = json_graph.node_link_data(G)

    graph = Graph()
    graph.title = "Balanced tree %s-%s" % (n, m)
    graph.body = json.dumps(data, ensure_ascii=False)
    graph.save()

    return HttpResponseRedirect('/zcore/')


# Для тестовых целей: создание разнообразных графов средствами библиотеки NetworkX
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


# Создание нового проекта
def create_project(request, graphFilter):
    # Создание графа - многомерной проекции "семантической кучи" - с заданными атрибутами узлов
    data = create_filtered_graph(graphFilter)

    #content = {'content': data}
    #return render(request, 'content.html', content)
    return HttpResponseRedirect('/') # Переадресуем на главную страницу
    #return True


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


def to_plane_graph(body):
    H = json.loads(body)
    data = json.dumps(H, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)
    return data


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


def view_force_react(request, id, graphFilter):
    graph = get_object_or_404(Graph, pk=id)
    #print(graphFilter)
    #jsonurl.query_string(graphFilter)
    context = {'filter': graphFilter, 'graph': graph}
    return render(request, 'zcore/force-react.html', context)


def view_force_d3(request, id, graphFilter, nodesList, color):
    graph = get_object_or_404(Graph, pk=id)
    context = {'graph': graph, 'filter': graphFilter, 'nodes': nodesList, 'color': color}
    return render(request, 'zcore/force-d3.html', context)


# Шаблон отображения графа в виде круговой диаграммы
def view_chord(request, id):
    graph = get_object_or_404(Graph, pk=id)
    context = {'graph': graph}
    return render(request, 'zcore/chord.html', context)


# Шаблон отображения данных на карте
def view_map(request, gid, nid):
    graph = get_object_or_404(Graph, pk=gid)
    context = {'graph': graph, 'nid': nid}
    return render(request, 'zcore/map.html', context)


# Шаблон отображения создания нового проекта
def view_new_project(request):
    context = ''
    return render(request, 'zcore/new-project.html', context)


# Шаблон отображения данных в виде графа - основной вид
def view_graph(request, id):
    graph = get_object_or_404(Graph, pk=id)
    context = {'graph': graph}
    return render(request, 'zcore/graph.html', context)


# Шаблон отображения графа в виде временной гистограммы
def view_timeline(request, id):
    graph = get_object_or_404(Graph, pk=id)
    context = {'graph': graph}
    return render(request, 'zcore/timeline.html', context)


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


