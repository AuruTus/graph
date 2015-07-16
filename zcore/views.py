# -*- coding: utf-8 -*-
import json
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

from .models import Graph, Node, create_graph_method_01, create_filtered_graph, print_json


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


def view_force(request, id):
    graph = get_object_or_404(Graph, pk=id)
    context = {'graph': graph}
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
        attributesState = graphFilter['attributesState']
        print('attributesState ', attributesState)
    except:
        returnErrorMessage('Неправильный json-массив attributesState')
        raise

    # Обрабатываем массив filterNodes
    try:
        filterNodes = graphFilter['filterNodes']
    except:
        returnErrorMessage('Неправильный json-массив filterNodes')
        raise

    # Обрабатываем массив filterOptions
    try:
        filterOptions = graphFilter['filterOptions']
        zero = filterOptions['zero']
    except:
        returnErrorMessage('Неправильный json-массив filterOptions')
        raise

    graphData = json.loads(graph.body)
    G0 = json_graph.node_link_graph(graphData)

    #print(graph.body)

    #print(json_graph.node_link_data(G))
    numberOfNodes = G0.number_of_nodes()
    print('Gnodes',numberOfNodes)
    numberOfEdges = G0.number_of_edges()
    print('Gedges',numberOfEdges)
    G1 = G0
    nodes = G0.nodes()
    #nodes = G0.nodes(data=True)
    for node in nodes:
        print(G0[node])
        pass
        #print(node,'-',G0.degree(node),'-',G0[node])

    # Если есть список id узлов, выбираем только их
    if len(filterNodes) == 0:
        G1 = G0
        #print('len ',len(filterNodes))
    else:
        nodesList = []
        for nid in filterNodes:
            print('nid ',nid)
            nodesList.append(nid)
            print('nodesList: ',nodesList)
            subs = nx.all_neighbors(G, nid)
            for sub in subs:
                nodesList.append(sub)
        print('nodesList: ',nodesList)
        G1 = G0.subgraph(nodesList)

    nodes = G1.nodes(data=True)
    for node in nodes:
        #print(G1.degree(node),'-',G1[node])
        #print(GG.degree(node))
        nid = int(node[0])
        attributes = node[1]['attributes']

        for attribute in attributes:
            if attribute['val'] not in attributesState:
                try:
                    G1.remove_node(nid)
                except:
                    pass

    # Если стоит фильтр на одиночные вершины - убираем их из графа
    nodes = G1.nodes()
    for node in nodes:
        if zero == 'no' and G1.degree(node) < 1:
            G1.remove_node(node)

    data = json_graph.node_link_data(G1)

    numberOfNodes = G1.number_of_nodes()
    data['graph'].append({'numberOfNodes': numberOfNodes})

    numberOfEdges = G1.number_of_edges()
    data['graph'].append({'numberOfEdges': numberOfEdges})

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
    sql = "SELECT id, name, display FROM propertydefs"

    # Выполняем sql-запрос
    cursor.execute(sql)

    # Получаем массив значений результата sql-запроса в виде словаря:
    # "ключ": "значение". Это необходимо для преоразования в json-формат
    data = dictfetchall(cursor)

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


# Для тестовых целей: создание проекции данных с ограниченным числом узлов
def json_semantic(request):
    G = nx.Graph() # Cоздаём пустой NetworkX-граф

    # Создаём объект типа cusros, который позволяет нам подключиться и работаться с базой данных,
    # содержащей данные многомерной матрицы
    cursor = connections['mysql'].cursor()

    offset = 0 # Начало первой возвращаемой строки
    rows = 100 # Максимальное количество возвращаемых строк

    # Формируем sql-запрос к таблице elements, содержащей информационные объекты (далее ИО).
    # Данные объекты, не имеющих связей - ent_or_rel=0 -  являются вершинами нашего графа
    sql = "SELECT el.id, el.data  FROM elements as el WHERE el.ent_or_rel=0 LIMIT "+str(offset)+","+str(rows)

    cursor.execute(sql) # Выполняем sql-запрос
    nodes = cursor.fetchall() # Получаем массив значений результата sql-запроса

    # В цикле проходимся по каждой строке результата запроса
    # и добавляем в граф узлы
    for node in nodes:

        # Вызываем функцию, добавляющую узел в граф, где:
        # node[0] - id узла;
        # G - граф;
        # node[1] - не обязательное поле data, которое мы используем в качестве одного из атрибутов узла;
        add_node_from_db(node[0], G, node[1])

        # Далее для этого узла ищем дуги и добавляем их в граф:
        # формируем sql-запрос к таблице relations, описывающей связи между ИО,
        # и таблице elements, откуда мы получаем поле data для текстового обозначения связи.
        # Эти связи являются дугами нашего графа.
        sql = "SELECT rel.id, rel.arg1, rel.arg2, el.data FROM relations as rel, elements as el WHERE rel.id = el.id AND (rel.arg1="+str(node[0])+" OR rel.arg2="+str(node[0])+")"

        cursor.execute(sql) # Выполняем sql-запрос
        edges = cursor.fetchall() # Получаем массив значений результата sql-запроса

        # Проходимся в цикле по всем строкам результата sql-запроса и добавляем в граф дуги.
        for edge in edges:

            # Для каждой дуги с помощью отдельной функции получаем словарь атрибутов.
            edgeAttributes = get_edge_attributes(edge[0])

            # Добавляем в граф дугу с атрибутами id и data,
            # а также, с полученным отдельно словарем атрибутов - attributes
            # Возможна ситуация, когда один из узлов дуги ещё не добавлен в граф,
            # В этом случае, при выполнении функции add_edge() узел будет добавлен автоматически, 
            # но без необходимых аттрибутов: это исправляется вызовом функции add_node_from_db().
            G.add_edge(edge[1], edge[2], id=edge[0], data=edge[3], attributes=edgeAttributes)
            add_node_from_db(int(edge[1]), G) # Добавляем к первому узлу дуги необходимые аттрибуты
            add_node_from_db(int(edge[2]), G) # Добавляем ко второму узлу дуги необходимые аттрибуты

    # Средствами бибилиотеки NetworkX,
    # экспортируем граф в виде подходящeм для json-сериализации
    graphData = json_graph.node_link_data(G)

    # Преобразуем данные в json-формат
    result = json.dumps(graphData, sort_keys=True, indent=4, separators=(',', ': '))

    response = HttpResponse() # Создаём объект response для динамического создания html-страницы
    response['Content-Type'] = "text/javascript; charset=utf-8" # Объявляем основные мета-данные html-страницы
    response.write(result) # Записываем в объкт response полученную структуру графа в json-формате

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


