# -*- coding: utf-8 -*-
import json
#import jsonurl
import networkx as nx
from networkx.readwrite import json_graph
from random import randint
import numpy as np
#from numpy import array

from django.shortcuts import get_object_or_404, render
from django.http import HttpResponse, HttpResponseRedirect
from django.db import connections

from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Graph, Node, create_filtered_graph, print_json, pdev


def responseJSON(data):
    try:
        # Преобразуем переданные данные в формат json
        jsonContent = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '))

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
    context = {'graphs': graphs}
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

    graph.body = json.dumps(data)
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
    graph.body = json.dumps(data)
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
    graph.body = json.dumps(data)
    graph.save()

    return HttpResponseRedirect('/')


# Создание нового проекта
def create_project(request, graphFilter):
    # Создание графа - многомерной проекции "семантической кучи" - с заданными атрибутами узлов
    data = create_filtered_graph(graphFilter)

    content = {'content': data}
    #return render(request, 'content.html', content)
    return HttpResponseRedirect('/') # Переадресуем на главную страницу


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

    data = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '))

    return data

def to_spring(body):
    H = json.loads(body)
    G = json_graph.node_link_graph(H)
    spring = nx.spring_layout(G)

    data = {'coords':[], 'links':[]}
    e = nx.edges(G)
    links = {'links': e}
    data.update(links)
    for k in spring:
        point = spring.get(k)
        x = str(point[0])
        y = str(point[1])
        data['coords'].append({'x':x,'y':y})

    data = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '))

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

    result = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '))

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

    data = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '))
    return data


def view_force_react(request, id, graphFilter):
    graph = get_object_or_404(Graph, pk=id)
    #print(graphFilter)
    #jsonurl.query_string(graphFilter)
    context = {'filter': graphFilter, 'graph': graph}
    return render(request, 'zcore/force-react.html', context)


def view_force(request, id, graphFilter):
    graph = get_object_or_404(Graph, pk=id)
    context = {'graph': graph, 'filter': graphFilter}
    return render(request, 'zcore/force.html', context)


def view_chord(request, id):
    graph = get_object_or_404(Graph, pk=id)
    context = {'graph': graph}
    return render(request, 'zcore/chord.html', context)


# Преобразование графа для вывода по алгоритму circular
def json_circular(request, id):
    graph = get_object_or_404(Graph, pk=id)

    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"

    circular = to_circular(graph.body)

    response.write(circular)
    #response.write('\n\n\n')
    #response.write(graph.body)
    return response 

# Преобразование графа для вывода по алгоритму spring
def json_spring(request, id):
    graph = get_object_or_404(Graph, pk=id)

    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"

    spring = to_spring(graph.body)

    response.write(spring)

    """
    H = json.loads(graph.body)
    G = json_graph.node_link_graph(H)
    response.write('\n\n\n')
    response.write(graph.body)
    """
    return response 


# Визуализация графа по алгоритму force-direct
def json_forced3(request, id, graphFilter):
    graph = get_object_or_404(Graph, pk=id)

    props = graphFilter.split(';')
    print(props)

    filterOptions = {}
    filterOptions['zero'] = 'yes'

    filterNodes = []
    #filterNodes = graphFilter['filterNodes']

    graphData = json.loads(graph.body)
    G0 = json_graph.node_link_graph(graphData)

    numberOfNodes = G0.number_of_nodes()
    numberOfEdges = G0.number_of_edges()
    pdev('G.nodes %i, G.edges %i' % (numberOfNodes,numberOfEdges))

    # Если передан массив узлов графа filterNodes, производим фильтрацию узлов
    if len(filterNodes) > 0:
        #pdev('Производим фильтрацию по переданным в filterNodes узлам')
        nodesList = []
        for nid in filterNodes:
            nodesList.append(nid)
            subs = nx.all_neighbors(G0, nid)
            for sub in subs:
                nodesList.append(sub)
        G1 = G0.subgraph(nodesList)
    else:
        G1 = G0


    if 'zerono' in props:
        print('zerono')
        # Если стоит фильтр на одиночные вершины - убираем их из графа
        nodes = G1.nodes()
        for node in nodes:
            #print('node %i - degree %i' % (node,G1.degree(node)))
            if G1.degree(node) < 1:
                G1.remove_node(node)

    if 'radiusattributes' in props:
        print('radiusattributes')
        # Добавлям кол-во атрибутов узла отфильтрованного графа в качестве атрибута numberOfAttributes
        for node in G1.nodes(data=True):
            numberOfAttributes = len(node[1]['attributes'][0])
            G1.add_node(node[0], radius=numberOfAttributes)

    if 'radiusdegree' in props:
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
    result = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '))
    #result=graph.body

    content = result
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"
    response.write(content)

    return response 


# Визуализация графа по алгоритму force-direct
def json_force(request, id, graphFilter):
    graph = get_object_or_404(Graph, pk=id)

    # Преобразуем в объект json-массив параметров, полученных из url 
    try: 
        graphFilter = json.loads(graphFilter)
        print_json(graphFilter)
    except:
        returnErrorMessage('Неправильный json-массив graphFilter')
        raise

    # Обрабатываем массив filterAttributes
    try:
        filterAttributes = graphFilter['filterAttributes']
    except:
        returnErrorMessage('Неправильный json-массив filterAttributes')
        #raise

    # Обрабатываем массив filterNodes
    try:
        filterNodes = graphFilter['filterNodes']
    except:
        returnErrorMessage('Неправильный json-массив filterNodes')
        raise

    # Обрабатываем массив filterOptions
    try:
        filterOptions = graphFilter['filterOptions']
    except:
        returnErrorMessage('Неправильный json-массив filterOptions')
        #raise

    graphData = json.loads(graph.body)
    G0 = json_graph.node_link_graph(graphData)

    numberOfNodes = G0.number_of_nodes()
    numberOfEdges = G0.number_of_edges()
    pdev('G.nodes %i, G.edges %i' % (numberOfNodes,numberOfEdges))

    # Если передан массив узлов графа filterNodes, производим фильтрацию узлов
    if len(filterNodes) > 0:
        #pdev('Производим фильтрацию по переданным в filterNodes узлам')
        nodesList = []
        for nid in filterNodes:
            nodesList.append(nid)
            subs = nx.all_neighbors(G0, nid)
            for sub in subs:
                nodesList.append(sub)
        G1 = G0.subgraph(nodesList)
    else:
        G1 = G0

    # Если передан массив атрибутов filterAttributes, производим фильтрацию аттрибутов
    if ('filterAttributes' in locals()) and (len(filterAttributes) > 0):
        #pdev('Производим фильтрацию в соответствии с переданными атрибутами в filterAttributes:\n' + str(filterAttributes))

        # Преобразуем ассоциативный массив в обычный, с учётом знаения true
        filterAttributesArray = []
        for attr in filterAttributes:
            if filterAttributes[attr]:
                filterAttributesArray.append(attr)

        nodes = G1.nodes(data=True)
        for node in nodes:
            #print(node)
            nid = int(node[0])
            attributes = node[1]['attributes']

            for attribute in attributes:
                if attribute['val'] not in filterAttributesArray:
                    try:
                        G1.remove_node(nid)
                    except:
                        #pdev('Узел с id ' + str(nid) + ' не найден')
                        pass

    # Если передан ассоциативный массив filterOptions, 
    # то производим дополнительную обработку графа согласно опциям
    if 'filterOptions' in locals():
        #pdev('Производим фильтрацию в соответствии с переданными опциями в filterOptions:\n' + str(filterOptions))

        # Иницилизация пустого графа в случае опции pass: True
        try:
            zpass = filterOptions['pass']
            #print('passsssss ',filterOptions['pass'])
            if filterOptions["pass"]:
                print('passsssss ',filterOptions['pass'])
                G1 = nx.Graph()
        except:
            pass

        try:
            zero = filterOptions['zero']
            # Если стоит фильтр на одиночные вершины - убираем их из графа
            nodes = G1.nodes()
            for node in nodes:
                if zero == 'no' and G1.degree(node) < 1:
                    #print('nid ',node,' degree ',G1.degree(node))
                    G1.remove_node(node)
        except:
            pass

    # Добавлям кол-во атрибутов узла отфильтрованного графа в качестве атрибута numberOfAttributes
    for node in G1.nodes(data=True):
        #print('attr ',node[1]['attributes'])
        numberOfAttributes = len(node[1]['attributes'][0])
        G1.add_node(node[0], numberOfAttributes=numberOfAttributes)
        pass

    # Добавлям значеие веса узлов отфильтрованного графа в качестве атрибута degree
    for node in G1.nodes():
        #print('degree ',G1.degree(node))
        G1.add_node(node, degree=G1.degree(node))
        pass

    data = json_graph.node_link_data(G1)

    numberOfNodes = G1.number_of_nodes()
    data['graph'].append({'numberOfNodes': numberOfNodes})

    numberOfEdges = G1.number_of_edges()
    data['graph'].append({'numberOfEdges': numberOfEdges})

    #data = G0data
    result = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '))
    #result=graph.body

    content = result
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"
    response.write(content)

    return response 


def json_chord(request, id, removeStandalone, graphFilter):
    """
    graph = get_object_or_404(Graph, pk=id)

    H = json.loads(graph.body)
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

    for node in H['nodes']:
        id = node['id']
        values = {'id': id, 'data': node['data']}
        data['nodes'].insert(id, values)

    data = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '))
    """


    graph = get_object_or_404(Graph, pk=id)
    graphFilter = 'last_name'

    H = json.loads(graph.body)
    G = json_graph.node_link_graph(H)
    N = nx.Graph()
    F = nx.Graph()
    filterBunch = []
    rsBunch = []
    msize = len(H['nodes'])
    M = np.zeros([msize,msize], dtype=int)


    nodes = G.nodes(data=True)
    for node in nodes:
        #print('\n',node[1]['data'],'\n')
        attributes = node[1]['attributes']
        for attribute in attributes:
            print(attribute['val'],'\n')
            if attribute['val'] in graphFilter:
                filterBunch.append(node[0])
                print(node[0])
                #print(attribute['val'],'\n')
                if G.degree(node[0]):
                    rsBunch.append(node[0])

    F = G.subgraph(filterBunch)
    N = G.subgraph(rsBunch)

    if removeStandalone == 'yes':
        data = json_graph.node_link_data(N)
    else:
        data = json_graph.node_link_data(F)

    m = M.tolist()
    data.update({"matrix": m})

    result = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '))
    
    content = result
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"
    response.write(data)
    return response 


# Получаем словарь атрибутов в формате json
def json_attributes(request):
    cursor = connections['mysql'].cursor()
    sql = "SELECT name, display FROM propertydefs"

    # Выполняем sql-запрос
    cursor.execute(sql)

    # Получаем массив значений результата sql-запроса в виде словаря:
    # "ключ": "значение". Это необходимо для преоразования в json-формат
    attributes = dictfetchall(cursor)
    data = []
    initValues = ['doc_name', 'doc_timestamp', 'full_name']
    for attribute in attributes:
        value = attribute['name']
        if value in initValues:
            checked = True
        else:
            checked = False
        display = attribute['display']
        data.append({'value': value, 'display': display, 'checked': checked})

    # Преобразуем данные в json-формат
    content = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '))

    # Создаём объект response для динамического создания html-страницы
    response = HttpResponse() 

    # Объявляем основные мета-данные html-страницы
    response['Content-Type'] = "text/javascript; charset=utf-8" 

    # Записываем в объкт response полученную структуру графа в json-формате
    response.write(content) 

    # возвращаем все необходимые фреймворку Django данные для окончательной генерации html-страницы
    return response 


class HeapInfo(APIView):

    def get(self, request):
        cursor = connections['mysql'].cursor() # Устанавливаем соединения с базой данных 'mysql'
        sql = "SELECT count(id) as nodes FROM db_fcp_vis.elements WHERE ent_or_rel=0"
        cursor.execute(sql) # Выполняем sql-запрос
        nodes = cursor.fetchall()[0][0]

        sql = "SELECT count(id) as edges FROM db_fcp_vis.elements WHERE ent_or_rel=1"
        cursor.execute(sql) # Выполняем sql-запрос
        edges = cursor.fetchall()[0][0]

        objects = nodes + edges

        data = {'objects': objects, 'nodes': nodes, 'edges': edges}

        return responseJSON(data)


