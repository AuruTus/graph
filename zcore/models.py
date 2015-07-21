# -*- coding: utf-8 -*-
import json
import networkx as nx
from networkx.readwrite import json_graph
#from random import randint
import numpy as np
#from numpy import array

from django.db import models
from django.db import connections
from django.http import HttpResponse, HttpResponseRedirect


# Производим фильтрацию графа по переданным в списке nodes узлам:
# возвращаем соседние узлы (если есть), включая переданный;
# где формат nodes [nid1, nid2, ...]
def GFilterNodes(G, nodes=[]):
    # Если список nodes содержит данные, производим фильтрацию узлов
    if len(nodes) > 0:
        nodesList = []
        for nid in nodes:
            nodesList.append(nid)
            neighbors = nx.all_neighbors(G, nid)
            for neighbor in neighbors:
                nodesList.append(neighbor)
        G = G.subgraph(nodesList)

    return G


# Исключаем из графа узлы с нулевым весом (без связей)
def GFilterZero(G, check):
    # Если check=true, производим фильтрацию узлов
    if len(check) > 0 and check == 'true':
        for nid in G.nodes():
            if G.degree(nid) < 1:
                G.remove_node(nid)

    return G
    

# Производим фильтрацию узлов графа по переданным в ассоциативном массивe attributes атрибутам узлов;
# где формат атрибутов {'attribute1': True, 'attribute2': False, ...}
def GFilterAttributes(G, attributes):
    # Если список attributes содержит данные, производим фильтрацию узлов
    if len(attributes) > 0:
        # Преобразуем ассоциативный массив в обычный, с учётом значения True
        attributesFlatten = []
        for attr in attributes:
            if attributes[attr]:
                attributesFlatten.append(attr)

        nodes = G.nodes(data=True)
        for node in nodes:
            nid = int(node[0])
            nodeAttributes = node[1]['attributes']

            # проходимся по списку атрибутов каждого узла
            for attr in nodeAttributes:
                # В случае отсутствия соответствия, удаляем узел из графа
                if attr['val'] not in attributesFlatten:
                    try:
                        G.remove_node(nid)
                    except:
                        #pdev('Узел с id ' + str(nid) + ' не найден')
                        pass
    return G

def pdev(str):
    print('\n',str,'\n')
    return True


class Graph(models.Model):
    title = models.CharField(max_length=200, default='граф')
    body = models.TextField()

    def __str__(self):
        name = 'id_' + str(self.pk) + ': ' + self.title
        return name

class Node(models.Model):
    id = models.PositiveIntegerField()
    data = models.CharField(max_length=500)

    class Meta:
        abstract = True

"""
class Method(models.Model):
    graph = models.ForeignKey(Graph)
    model_title = models.CharField(max_length=200, default='')
"""


def dictfetchall(cursor):
    "Returns all rows from a cursor as a dict"
    desc = cursor.description
    return [
        dict(zip([col[0] for col in desc], row))
        for row in cursor.fetchall()
    ]


# Отформатированный вывод данных в формате json
def print_json(data):
    print(json.dumps(data, indent=4, sort_keys=True))


# Вывод сформированных данных для отладочных целей 
def render_content(content):
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"
    print(content)
    response.write(content)
    return response 


# Получение атрибутов информационного объекта вида узел
def get_node_attributes(element_id, filterAttributesString):
    nodeAttributes = False

    if filterAttributesString:
        cursor = connections['mysql'].cursor()
        sql = "SELECT prpdf.name, prpdf.display, prp.str_val \
            FROM properties as prp, propertydefs as prpdf \
            WHERE prp.def_id=prpdf.id AND prp.target_id=%i AND prpdf.name IN (%s)" \
            % (element_id, filterAttributesString)
        cursor.execute(sql)
        attributes = cursor.fetchall()
        data = []
        if attributes:
            for attribute in attributes:
                data.append({'val':attribute[0],'name':attribute[1],'display':attribute[2]})
            nodeAttributes = data

    else:
        cursor = connections['mysql'].cursor()
        sql = "SELECT prpdf.name, prpdf.display, prp.str_val FROM properties as prp, propertydefs as prpdf WHERE prp.def_id=prpdf.id AND target_id=%i" % (element_id)
        cursor.execute(sql)
        attributes = cursor.fetchall()
        data = []
        for attribute in attributes:
            data.append({'val':attribute[0],'name':attribute[1],'display':attribute[2]})
        nodeAttributes = data

    return nodeAttributes


# Получение атрибутов информационного объекта вида дуга
def get_edge_attributes_from_db(element_id):
    return ''


def add_neighbour_nodes_from_db(nid, G, filterAttributesString):
    cursor = connections['mysql'].cursor()
    sql = "SELECT rel.id, rel.arg1, rel.arg2, el.data \
        FROM relations as rel, elements as el \
        WHERE rel.id = el.id AND (rel.arg1=%i OR rel.arg2=%i)" \
        % (nid, nid)
    cursor.execute(sql) # Выполняем sql-запрос
    edges = dictfetchall(cursor) # Получаем массив значений результата sql-запроса в виде словаря

    # Проходимся в цикле по всем строкам результата sql-запроса 
    # и, в зависимости от результата фильтрации, добавляем в граф дуги
    for edge in edges:
        # Для каждой дуги с помощью отдельной функции получаем словарь атрибутов.
        edgeAttributes = get_edge_attributes_from_db(edge['id'])

        # Если другая вершина дуги подходит по параметрам фильтра, добавляем дугу
        if nid == edge['arg1']:
            checkedID = edge['arg2']
        else:
            checkedID = edge['arg1']
        nodeAttributes = get_node_attributes(checkedID, filterAttributesString)
        if nodeAttributes:
            #print('checkid',nid,'-',checkedID)
            G.add_edge(edge['arg1'], edge['arg2'], id=edge['id'], data=edge['data'], attributes=edgeAttributes)

    return True

# Добавляем узел в граф при создании многомерной проекции "семантической кучи"
def add_node_from_db(nid, G, filterAttributesString=False, nodeData=False):
    nodeAdded = False

    # Проверяем, передаётся ли в функцию значение поля data:
    # eсли значение не передаётся, мы совершаем дополнительный запрос к базе данных.
    # Это необходимо когда id узла полученно каким-то другим способом.
    # Например, в результате запроса к таблице связей relations.
    if not nodeData:
        cursor = connections['mysql'].cursor()
        sql = "SELECT el.data  FROM elements as el WHERE el.id=%i" % (nid)
        cursor.execute(sql)
        row = cursor.fetchone()
        nodeData = row[0]

    # Для каждого узла с помощью отдельной функции получаем словарь атрибутов
    nodeAttributes = get_node_attributes(nid, filterAttributesString)

    # Добавляем узел в граф вместе с полученным словарём атрибутов.
    # В качестве атрибута data указываем значение поля data, 
    # в последствии, это значение будет использованно в поиске по-умолчанию
    if nodeAttributes:
        G.add_node(nid, data=nodeData, attributes=nodeAttributes)
        nodeAdded = nid

    return nodeAdded


# Создание графа - многомерной проекции "семантической кучи" - с заданными атрибутами узлов
def create_filtered_graph(graphFilter):
    # Cоздаём пустой NetworkX-граф
    G = nx.Graph()

    # Преобразуем в объект json-массив параметров, полученных из url 
    try: 
        graphFilter = json.loads(graphFilter)
    except:
        render_content('Неправильный json-массив graphFilter')
        raise

    # Обрабатываем массив filterAttributes
    try:
        filterAttributes = graphFilter['filterAttributes']
        print_json(filterAttributes)
    except:
        render_content('Неправильный json-массив filterAttributes')
        raise

    # Обрабатываем массив filterOptions
    try:
        filterOptions = graphFilter['filterOptions']
        zero = filterOptions['zero']
    except:
        render_content('Неправильный json-массив filterOptions')
        raise

    # Устанавливаем соединение с БД, в которой хранятся семантически связанные данные
    cursor = connections['mysql'].cursor()

    # Формируем sql-запрос к таблице elements, содержащей информационные объекты (далее ИО).
    # Данные объекты, не имеющих связей - ent_or_rel=0 -  являются вершинами нашего графа
    sql = "SELECT el.id, el.data  FROM elements as el WHERE el.ent_or_rel=0"

    cursor.execute(sql) # Выполняем sql-запрос
    nodes = cursor.fetchall() # Получаем массив значений результата sql-запроса

    # Преобразуем ассоциативный массив в обычный, с учётом знаения true
    filterAttributesArray = []
    for attr in filterAttributes:
        if filterAttributes[attr]:
            filterAttributesArray.append(attr)

    # В цикле проходимся по каждой строке результата запроса
    # и добавляем в граф узлы
    for node in nodes:

        # Формируем sql-запрос для выборки ИО, подходящих под параметры фильтра
        filterAttributesString = "'" + "','".join(filterAttributesArray) + "'"
        #sql = "SELECT prpdf.name, prpdf.display, prp.str_val FROM properties as prp, propertydefs as prpdf WHERE prp.def_id=prpdf.id AND target_id=%i AND prpdf.name IN (%s)" % (node[0], filterAttributesString)


        # Вызываем функцию, добавляющую узел в граф, где:
        # node[0] - id узла;
        # G - граф;
        # node[1] - не обязательное поле data, которое мы используем в качестве одного из атрибутов узла;
        nodeAdded = add_node_from_db(node[0], G, filterAttributesString, node[1])
        # Если узел был добавлен, добавляем всех его соседей с учётом фильтра
        if nodeAdded:
            add_neighbour_nodes_from_db(node[0], G, filterAttributesString)

    # Добавлям значеие веса узлов созданного графа в качестве атрибута degree
    for node in G.nodes():
        #print('degree ',G.degree(node))
        #G.add_node(node, degree=G.degree(node))
        pass

    # Средствами бибилиотеки NetworkX,
    # экспортируем граф в виде подходящeм для json-сериализации
    data = json_graph.node_link_data(G)

    # Создаём экземпляр класса Graph, для хранения структуры графа в базе данных
    graph = Graph() 

    # Определяем заголовок графа
    graph.title = "Многомерная проекция 'семантической кучи' по заданному фильтру" 

    # Преобразуем данные в json-формат
    graph.body = json.dumps(data) 

    numberOfNodes = G.number_of_nodes()
    pdev('Gnodes %i' % (numberOfNodes))

    numberOfEdges = G.number_of_edges()
    pdev('Gedges %i' % (numberOfEdges))

    # Сохраняем граф в собственную базу данных
    graph.save() 

    return graph.body


