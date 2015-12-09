# -*- coding: utf-8 -*-
import json
import networkx as nx
from networkx.readwrite import json_graph
from random import randint
import numpy as np
#from numpy import array
import warnings

from django.db import models
from django.db import connections
from django.http import HttpResponse, HttpResponseRedirect


# Функция которая получает на вход словарь где: ключ = int, значение = bool;
# и возвращает список только тех элементов, где значение True
def flatten_int_by_true(d):
    if len(d) > 0:
        l = []
        for obj in d:
            if d[obj]:
                l.append(int(obj))
    return l


# Производим фильтрацию графа по переданным в списке nodes узлам:
# возвращаем соседние узлы (если есть), включая переданный;
# где формат nodes [nid1, nid2, ...]
def GFilterNodes(G, nodes):
    # Если список nodes содержит данные, производим фильтрацию узлов
    if nodes and len(nodes) > 0:
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
                attributesFlatten.append(str(attr))

        nodes = G.nodes(data=True)
        for node in nodes:
            nid = int(node[0])
            #print(nid,'>',G.node[nid])
            # проходимся по списку атрибутов каждого узла
            #print('attributes: ',node[1]['attributes'])
            for attr in node[1]['attributes']:
                print('\n\n',nid,'>',str(attr['id']),'>',attributesFlatten)
                # В случае отсутствия соответствия, удаляем узел из графа
                if str(attr['id']) not in attributesFlatten:
                    try:
                        G.remove_node(nid)
                        print('remove: ',node[1]['data'])
                    except:
                        #pdev('Узел с id ' + str(nid) + ' не найден')
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


# Оставляем в графе только те узлы, атрибут data которых совпадает с переданной строкой
def GFilterNodeData(FG, GG, data):
    data = str(data).lower()
    # Если data содержит текст, производим фильтрацию узлов
    nodes = []
    print('nodedata',data)
    if len(data) > 0:
        for node in FG.nodes(data=True):
            nid = int(node[0])
            zstr = node[1]['data'].lower()
            if data in zstr:
                nodes.append(nid)
        nodesList = []
        for nid in nodes:
            print('nid',nid)
            nodesList.append(nid)
            neighbors = nx.all_neighbors(GG, nid)
            print('n',neighbors)
            for neighbor in neighbors:
                print('тушп',neighbor)
                nodesList.append(neighbor)
        print('nl',nodesList)
        FG = GG.subgraph(nodesList)

    return FG
    

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


# Определяем список id терминов таксономии, входящих (детей) в термин Территория
def get_taxonomy_territory_list(parent_id=45, l=None):
    if not l:
        l = [parent_id]
    #get_taxonomy_territory_list.l.append(parent_id)
    cursor = connections['mysql'].cursor()
    sql = "SELECT id, parent_id FROM taxonomy WHERE parent_id=%i" % (parent_id)
    cursor.execute(sql)
    terms = cursor.fetchall()
    for term in terms:
        print('tid',term[0])
        print('parent_id',term[1])
        l.append(term[0])
        #if term[1]:
            #get_taxonomy_territory_list(term[1])
    
    return l


#
#
# Создаем граф из данных "семантической кучи"
class SGraph():
    # Получение атрибутов информационного объекта вида узел
    def get_node_taxonomy(self, nid, nodeData):
        sql = "SELECT tax.* FROM element_taxonomy as elt, taxonomy as tax WHERE elt.element_id=%i AND elt.taxonomy_id=tax.id" % (nid)
        self.cursor.execute(sql)
        term = self.cursor.fetchone()
        data = {'tid':term[0],'parent_tid':term[1],'name':term[3]}
        #print('geotag',term[0])
        if term[0] in self.taxTerritory:
            # https://geocode-maps.yandex.ru/1.x/?format=json&geocode=
            data.update({'geotag': nodeData})

        return data


    # Получение атрибутов информационного объекта вида узел
    def get_node_attributes(self, nid):
        sql = "SELECT p.id, p.name, ep.str_val \
        FROM property as p, element_property as ep \
        WHERE p.id=ep.property_id AND ep.element_id=%i" % (nid)
        self.cursor.execute(sql)
        attributes = self.cursor.fetchall()
        data = []
        for attribute in attributes:
            data.append({'id':attribute[0],'name':attribute[1],'value':attribute[2]})
        nodeAttributes = data

        return nodeAttributes


    # Получение атрибутов информационного объекта вида дуга
    def get_edge_attributes(self, element_id):
        return ''


    # Добавляем узел в граф при создании многомерной проекции "семантической кучи"
    def add_node(self, nid):
        # Для предотвращения случайного дублирования одного и того же узла с одинаковым id, но 
        # с разным типом данных - int и str, производим преобразование типов
        nid = int(nid)
        # Получаем значение поля data
        sql = "SELECT el.data  FROM element as el WHERE el.id=%i" % (nid)
        self.cursor.execute(sql)
        row = self.cursor.fetchone()
        # Получаем значение поля data, убираем лишние пробелы
        nodeData = ' '.join(str(row[0]).split())

        # Для каждого узла с помощью отдельной функции получаем словарь атрибутов
        nodeAttributes = self.get_node_attributes(nid)
        # Для каждого узла с помощью отдельной функции получаем тип узла
        nodeTaxonomy = self.get_node_taxonomy(nid, nodeData)
        
        # Симуляция обработки данных о должности персоны
        if nodeTaxonomy['tid'] == 1 and self.positions:
            count = len(self.positions) - 1
            rand = randint(0,count)
            #print('rand',rand)
            position = self.positions[rand][0]
            nodeAttributes.append({'val': 'position', 'display': position, 'name': 'Должность'})
            #print(nodeAttributes)
        # /Симуляция обработки данных о должности персоны
        
        # Добавляем узел в граф вместе с полученнымы словарями атрибутов, таксономии
        # В качестве атрибута data указываем значение поля data у заданного nid'ом информационного объекта 
        self.G.add_node(nid, data=nodeData, attributes=nodeAttributes, taxonomy=nodeTaxonomy)

        return nid


    # Добавляем дуги к указанному узлу
    def add_node_with_edges(self, nid):
        sql = "SELECT el.id, el.element_id_1, el.element_id_2, el.data \
            FROM element as el \
            WHERE el.element_id_1=%i OR el.element_id_2=%i" \
            % (nid, nid)
        self.cursor.execute(sql) # Выполняем sql-запрос
        edges = dictfetchall(self.cursor) # Получаем массив значений результата sql-запроса в виде словаря
        # Проходимся в цикле по всем строкам результата sql-запроса и добавляем в граф дуги
        # и сопутствующие данные к новым узлам графа
        for edge in edges:
            enid = edge['element_id_2'] if nid == edge['element_id_1'] else edge['element_id_1']
            # Для каждой дуги с помощью отдельной функции получаем словарь атрибутов.
            edgeAttributes = self.get_edge_attributes(edge['id'])
            # Добавляем дугу в граф для указанного узла и её атрибуты
            self.G.add_edge(nid, enid, id=edge['id'], data=edge['data'], attributes=edgeAttributes)
            # Добавляем в граф отсутствующий узел
            self.add_node(enid)

        return True


    # Главная функция создания максимально большого графа 
    def create(self, stopper, taxonomy):
        pdev("creating max graph...")
        # Cоздаём пустой NetworkX-граф
        self.G = nx.Graph()
        # Устанавливаем соединение с БД, в которой хранятся семантически связанные данные
        self.cursor = connections['mysql'].cursor()

        # Получаем список id терминов таксономии, входящих (детей) в термин Территория
        #print('territoryTaxonomy',get_taxonomy_territory_list())
        self.taxTerritory = get_taxonomy_territory_list()

        # Добавляем сортировку по терминам классификатора сущностей
        taxonomy = flatten_int_by_true(taxonomy)
        tax = str(taxonomy).strip('[]')

        # Формируем sql-запрос к таблице elements, содержащей информационные объекты (далее ИО)
        # объекты со значением ent_or_rel=1 -  являются вершинами нашего графа
        sql = "SELECT * FROM element as e, element_taxonomy as et \
            WHERE e.is_entity=1 AND e.id=et.element_id AND et.taxonomy_id IN (%s)" % (tax)
        self.cursor.execute(sql) # Выполняем sql-запрос
        nodes = self.cursor.fetchall() # Получаем массив значений результата sql-запроса

        # В цикле проходимся по каждой строке результата запроса и добавляем в граф узлы
        counter = 0 # счётчик ограничения узлов нужен только на стадии разработки для экономии ресурсов 
        for node in nodes:
            nid = int(node[0]) # id узла
            # Если ID узла является цифровым значением и не равно нулю:
            #if nid and counter < stopper:
            if nid and counter < 10:
                counter = counter + 1
                # Добавляем узел в объект типа граф, предоставленного библиотекой NetworkX
                # positions - массив должностей, count - кол-во; нужно для симуляции обработки должности
                self.add_node(nid)
                # Добавляем дуги к указанному узлу
                self.add_node_with_edges(nid)

        return self.G


# /Создаем граф из данных "семантической кучи";
#
#


def create_filtered_graph(gfilter):
    try: 
        gfilter = json.loads(gfilter)
        print_json(gfilter)

        # Создаем граф из данных "семантической кучи";
        # производим фильтрацию узлов графа по переданному массиву типов сущностей taxonomy;
        SG = SGraph()
        G = SG.create(gfilter['options'].get('stopper'), gfilter.get('taxonomy'))

        # Исключаем из графа узлы с нулевым весом (без связей)
        G = GFilterZero(G, gfilter['options'].get('removeZero'))
        # Производим фильтрацию узлов графа по переданным в ассоциативном массивe attributes атрибутам узлов;
        #G = GFilterAttributes(G, gfilter.get('attributes'))
    except:
        warnings.warn('Ошибка при обработке json-массива gfilter', UserWarning)
        raise

    # Средствами бибилиотеки NetworkX,
    # экспортируем граф в виде подходящeм для json-сериализации
    data = json_graph.node_link_data(G)

    # отладочная информация
    jsonContent = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)
    print(jsonContent)

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
            sql = "SELECT * FROM taxonomy WHERE facet_id=1 AND parent_id=%i" % (tid)
        else:
            sql = "SELECT * FROM taxonomy WHERE facet_id=1 AND parent_id IS NULL"
        cursor.execute(sql)
        terms = cursor.fetchall()

        for term in terms:
            parent_tid = term[1]
            children = self.get_taxonomy(term[0])
            data.append({'tid': term[0], 'parent_tid': parent_tid, 'value': term[0], 'display': term[3], 'children': children, 'checked': True})

        return data


#
#

