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
    removeZero = False
    # Если check имеет тип bool и значение True, производим фильтрацию узлов
    if isinstance(check, (bool)) and check == True:
        removeZero = True
    # Если check имеет строковый тип и значение 'true', производим фильтрацию узлов
    elif len(str(check)) > 0 and str(check) == 'true':
        removeZero = True
    if removeZero:    
        for nid in G.nodes():
            if G.degree(nid) < 1:
                G.remove_node(nid)

    return G
    

# Производим фильтрацию узлов графа по переданным в ассоциативном массивe attributes атрибутам узлов;
# где формат атрибутов {'attribute1': True, 'attribute2': False, ...}
def GFilterAttributes(G, attributes):
    # Если список attributes содержит данные, производим фильтрацию узлов
    if len(attributes) > 0:
        # Преобразуем ассоциативный массив в обычный с учётом значения true
        attributesFlatten = []
        for attr in attributes:
            if attributes[attr]:
                attributesFlatten.append(attr)

        nodes = G.nodes(data=True)
        for node in nodes:
            nid = int(node[0])
            #print(nid,'>',G.node[nid])
            # проходимся по списку атрибутов каждого узла
            for attr in node[1]['attributes']:
                #print(nid,'>',attr['val'],'>',attributesFlatten)
                # В случае отсутствия соответствия, удаляем узел из графа
                if attr['val'] not in attributesFlatten:
                    try:
                        pass
                        G.remove_node(nid)
                    except:
                        pdev('Узел с id ' + str(nid) + ' не найден')
                        pass

    return G


# Производим фильтрацию узлов графа по переданному массиву типов ИО
def GFilterTaxonomy(G, ttypes):
    # Если массив types содержит данные, производим фильтрацию узлов
    if len(ttypes) > 0:
        # Преобразуем ассоциативный массив в обычный с учётом значения true
        ttypesFlatten = []
        for ttype in ttypes:
            if ttypes[ttype]:
                ttypesFlatten.append(int(ttype))

        nodes = G.nodes(data=True)
        for node in nodes:
            nid = int(node[0])
            # проходимся по списку атрибутов каждого узла
            # В случае отсутствия типа узла в переданном массиве типов фильтра
            if node[1]['taxonomy']['tid'] not in ttypesFlatten:
                try:
                    G.remove_node(nid)
                except:
                    pdev('Узел с id ' + str(nid) + ' не найден')
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


def dictfetchall(cursor):
    "Returns all rows from a cursor as a dict"
    desc = cursor.description
    return [
        dict(zip([col[0] for col in desc], row))
        for row in cursor.fetchall()
    ]


# Отформатированный вывод данных в формате json
def print_json(data):
    print(json.dumps(data, indent=4, sort_keys=True, ensure_ascii=False))


# Вывод сформированных данных для отладочных целей 
def render_content(content):
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"
    print(content)
    response.write(content)
    return response 


#
#
# Создаем граф с максимально возможным кол-вом узлов и связей исходя из исходный данных - семантической кучи

# Получение атрибутов информационного объекта вида узел
def semheap_get_node_taxonomy(nid):
    cursor = connections['mysql'].cursor()
    sql = "SELECT tax.* FROM elementclasses as elc, taxonomy as tax WHERE elc.element_id=%i AND elc.class_id=tax.id" % (nid)
    cursor.execute(sql)
    term = cursor.fetchone()
    data = {'tid':term[0],'parent_tid':term[1],'name':term[2]}

    return data


# Получение атрибутов информационного объекта вида узел
def semheap_get_node_attributes(nid):
    cursor = connections['mysql'].cursor()
    sql = "SELECT prpdf.name, prpdf.display, prp.str_val FROM properties as prp, propertydefs as prpdf WHERE prp.def_id=prpdf.id AND target_id=%i" % (nid)
    cursor.execute(sql)
    attributes = cursor.fetchall()
    data = []
    for attribute in attributes:
        data.append({'val':attribute[0],'name':attribute[1],'display':attribute[2]})
    nodeAttributes = data

    return nodeAttributes


# Получение атрибутов информационного объекта вида дуга
def semheap_get_edge_attributes(element_id):
    return ''


# Добавляем узел в граф при создании многомерной проекции "семантической кучи"
def semheap_add_node(nid, G):
    # Для предотвращения случайного дублирования одного и того же узла с одинаковым id, но 
    # с разным типом данных - int и str, производим преобразование типов
    nid = int(nid)
    # Получаем значение поля data
    cursor = connections['mysql'].cursor()
    sql = "SELECT el.data  FROM elements as el WHERE el.id=%i" % (nid)
    cursor.execute(sql)
    row = cursor.fetchone()
    nodeData = row[0]

    # Для каждого узла с помощью отдельной функции получаем словарь атрибутов
    nodeAttributes = semheap_get_node_attributes(nid)
    # Для каждого узла с помощью отдельной функции получаем тип узла
    nodeTaxonomy = semheap_get_node_taxonomy(nid)
    # Добавляем узел в граф вместе с полученнымы словарями атрибутов, таксономии
    # В качестве атрибута data указываем значение поля data у заданного nid'ом информационного объекта 
    G.add_node(nid, data=nodeData, attributes=nodeAttributes, taxonomy=nodeTaxonomy)

    return nid


# Добавляем дуги к указанному узлу
def semheap_add_node_with_edges(nid, G):
    cursor = connections['mysql'].cursor()
    sql = "SELECT rel.id, rel.arg1, rel.arg2, el.data \
        FROM relations as rel, elements as el \
        WHERE rel.id = el.id AND (rel.arg1=%i OR rel.arg2=%i)" \
        % (nid, nid)
    cursor.execute(sql) # Выполняем sql-запрос
    edges = dictfetchall(cursor) # Получаем массив значений результата sql-запроса в виде словаря
    # Проходимся в цикле по всем строкам результата sql-запроса и добавляем в граф дуги
    # и сопутствующие данные к новым узлам графа
    for edge in edges:
        enid = edge['arg2'] if nid == edge['arg1'] else edge['arg1']
        # Для каждой дуги с помощью отдельной функции получаем словарь атрибутов.
        edgeAttributes = semheap_get_edge_attributes(edge['id'])
        # Добавляем дугу в граф для указанного узла и её атрибуты
        G.add_edge(nid, enid, id=edge['id'], data=edge['data'], attributes=edgeAttributes)
        # Добавляем в граф отсутствующий узел
        semheap_add_node(enid, G)

    return True


# Главная функция создания максимально большого графа 
def semheap_create_max_graph():
    pdev("creating max graph...")
    # Cоздаём пустой NetworkX-граф
    G = nx.Graph()

    # Устанавливаем соединение с БД, в которой хранятся семантически связанные данные
    cursor = connections['mysql'].cursor()

    # Формируем sql-запрос к таблице elements, содержащей информационные объекты (далее ИО).
    # объекты со значением ent_or_rel=1 -  являются вершинами нашего графа
    sql = "SELECT el.id FROM elements as el WHERE el.ent_or_rel=1"

    cursor.execute(sql) # Выполняем sql-запрос
    nodes = cursor.fetchall() # Получаем массив значений результата sql-запроса

    # В цикле проходимся по каждой строке результата запроса и добавляем в граф узлы
    # node[0] - id узла, node[1] - поле data
    counter = 0
    for node in nodes:
        nid = int(node[0])
        # Если ID узла является цифровым значением и не равно нулю:
        if nid and counter < 5000:
            counter = counter + 1
            # Добавляем узел в объект типа граф, предоставленного библиотекой NetworkX
            semheap_add_node(nid, G)
            # Добавляем дуги к указанному узлу
            semheap_add_node_with_edges(nid, G)

    return G


# /Создаем граф с максимально возможным кол-вом узлов и связей исходя из данных семантической кучи
#
#


def create_filtered_graph(graphFilter):
    # Создаем максимально возможный граф из исходных данных - семантической кучи
    G = semheap_create_max_graph()

    # Преобразуем в объект json-массив параметров, полученных из url 
    try: 
        graphFilter = json.loads(graphFilter)
    except:
        render_content('Ошибка при обработке json-массива graphFilter')
        raise

    # Обрабатываем массив filterOptions
    try:
        filterOptions = graphFilter['filterOptions']
        # Производим фильтрацию полученного графа по выбранным в фильтре опциям
        G = GFilterZero(G, filterOptions['removeZero'])
    except:
        render_content('Ошибка при обработке json-массива filterOptions')
        raise

    # Обрабатываем массив filterAttributes
    try:
        filterAttributes = graphFilter['filterAttributes']
        #print_json(filterAttributes)
        #G = GFilterAttributes(G, filterAttributes)
    except:
        render_content('Ошибка при обработке json-массива filterAttributes')
        raise

    # Обрабатываем массив filterTaxonomy
    try:
        filterTaxonomy = graphFilter['filterTaxonomy']
        #print_json(filterTaxonomy)
        #  Производим фильтрацию по выбранным типам ИО
        #G = GFilterTaxonomy(G, filterTaxonomy)
    except:
        render_content('Ошибка при обработке json-массива filterTaxonomy')
        raise

    # Средствами бибилиотеки NetworkX,
    # экспортируем граф в виде подходящeм для json-сериализации
    data = json_graph.node_link_data(G)

    # отладочная информация
    #jsonContent = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)
    #print(jsonContent)

    # Создаём экземпляр класса Graph, для хранения структуры графа в базе данных
    graph = Graph() 
    # Получаем кол-во узлов графа
    numberOfNodes = G.number_of_nodes()
    # Получаем кол-во дуг графа
    numberOfEdges = G.number_of_edges()

    pdev('yзлов %i, дуг %i' % (numberOfNodes, numberOfEdges)) # отладка: выводим кол-во узлов и дуг

    # Определяем заголовок графа
    graph.title = "Многомерная проекция 'семантической кучи' по заданному фильтру: узлов " + str(numberOfNodes) + "; дуг " + str(numberOfEdges)
    # Преобразуем данные в json-формат
    graph.body = json.dumps(data, ensure_ascii=False)
    # Сохраняем граф в собственную базу данных
    graph.save() 

    return graph.body


#
#
# Класс для работы с таксономией
class Taxonomy():
    def get_taxonomy(self, tid=None):
        data = []
        cursor = connections['mysql'].cursor()
        # Получаем массив "детей" термина из семантической кучи
        if tid:
            sql = "SELECT * FROM taxonomy WHERE facet_id=0 AND parent_id=%i" % (tid)
        else:
            sql = "SELECT * FROM taxonomy WHERE facet_id=0 AND parent_id IS NULL"
        cursor.execute(sql)
        terms = cursor.fetchall()

        for term in terms:
            parent_tid = term[1]
            children = self.get_taxonomy(term[0])
            data.append({'tid': term[0], 'parent_tid': parent_tid, 'value': term[0], 'display': term[3], 'children': children, 'checked': True})

        return data


#
#
#
