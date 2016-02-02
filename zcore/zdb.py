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

from rest_framework.views import APIView

from .zcommon import *
from .zgraph import *
from .models import *


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


# Определение списока id терминов таксономии, входящих (детей) в термин Территория
def get_taxonomy_territory_list(parent_id=45, l=None):
    if not l:
        l = [parent_id]
    #get_taxonomy_territory_list.l.append(parent_id)
    cursor = connections['mysql'].cursor()
    sql = "SELECT id, parent_id FROM taxonomy WHERE parent_id=%i" % (parent_id)
    cursor.execute(sql)
    terms = cursor.fetchall()
    for term in terms:
        #print('tid',term[0])
        #print('parent_id',term[1])
        l.append(term[0])
        #if term[1]:
            #get_taxonomy_territory_list(term[1])
    
    return l


def find_values(id, json_repr):
    results = []
    def _decode_dict(a_dict):
        try: results.append(a_dict[id])
        except KeyError: pass
        return a_dict

    json.loads(json_repr, object_hook=_decode_dict)  # return value ignored
    return results


#
#
# Создание графа из массива связанных данных, содержащихся в СУБД, на основе массива параметров сформированного пользователем
class SGraph():
    # Получение таксономии информационного объекта вида узел
    def get_node_taxonomy(self, nid, nodeData):
        sql = "SELECT tax.* FROM element_taxonomy as elt, taxonomy as tax WHERE elt.element_id=%i AND elt.taxonomy_id=tax.id" % (nid)
        self.cursor.execute(sql)
        term = self.cursor.fetchone()
        data = {'tid':term[0],'parent_tid':term[1],'name':term[3]}
        #print('geotag',term[0])
        if term[0] in self.taxTerritory:
            r = requests.get('https://geocode-maps.yandex.ru/1.x/?format=json&geocode=' + nodeData)
            resp = r.json()['response']
            #print(find_values('Point', resp))
            #json_repr = '{"P1": "ss", "Id": 1234, "P2": {"P1": "cccc"}, "P3": [{"P1": "aaa"}]}'
            #print(find_values('P1', json_repr))
            try:
                pos = resp.get('GeoObjectCollection').get('featureMember')[0].get('GeoObject').get('Point').get('pos')
                data.update({'geotag': pos})
            except:
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


    # Добавление узла в граф при создании многомерной проекции "семантической кучи"
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


    # Добавление дуги к указанному узлу
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
            if nid and counter < stopper:
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
        G = SG.create(int(gfilter.get('stopper')), gfilter.get('taxonomy'))

        # Исключаем из графа узлы с нулевым весом (без связей)
        G = GFilterZero(G, gfilter['options'].get('removeZero'))
        #G = GFilterAttributes(G, gfilter.get('attributes')) # Фильтрация узлов графа по переданным в ассоциативном массивe attributes атрибутам узлов;
    except:
        warnings.warn('Ошибка при обработке json-массива gfilter', UserWarning)
        raise

    data = json_graph.node_link_data(G) # Средствами бибилиотеки NetworkX, экспортируем граф в виде подходящeм для json-сериализации
    graph = StorageGraph() # Создаём экземпляр класса Graph, для хранения структуры графа в базе данных
    numberOfNodes = G.number_of_nodes() # Получаем кол-во узлов графа
    numberOfEdges = G.number_of_edges() # Получаем кол-во дуг графа
    graph.title = "Проекция: узлов " + str(numberOfNodes) + "; дуг " + str(numberOfEdges) # Определяем заголовок графа
    graph.body = json.dumps(data, ensure_ascii=False) # Преобразуем данные в json-формат
    #graph.layout_spring = to_main_graph(graph.body) # получаем массив компоновки по-умолчанию (типа spring)
    graph.save() # Сохраняем граф в собственную базу данных

    #jsonContent = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False); print(jsonContent) # отладочная информация
    pdev('yзлов %i, дуг %i' % (numberOfNodes, numberOfEdges)) # отладка: выводим кол-во узлов и дуг

    return graph.body


# Обработка http запроса:
# Получение общей информации об исходных связанных данных 
def db_heap_info():
    cursor = connections['mysql'].cursor() # Устанавливаем соединения с базой данных 'mysql'
    sql = "SELECT count(id) as nodes FROM element WHERE is_entity=1"
    cursor.execute(sql) # Выполняем sql-запрос
    nodes = cursor.fetchall()[0][0]
    sql = "SELECT count(id) as edges FROM element WHERE is_entity=0"
    cursor.execute(sql) # Выполняем sql-запрос
    edges = cursor.fetchall()[0][0]
    objects = nodes + edges
    data = {'objects': objects, 'nodes': nodes, 'edges': edges}

    return data


# Обработка http запроса:
# Получение словаря атрибутов информационных объектов в формате json
def db_json_attributes():
    cursor = connections['mysql'].cursor() # Устанавливаем соединения с базой данных 'mysql'
    sql = "SELECT id, name FROM property"
    cursor.execute(sql) # Выполняем sql-запрос
    attributes = dictfetchall(cursor) # Получаем массив значений результата sql-запроса в виде словаря: "ключ": "значение". Это необходимо для преоразования в json-формат

    return attributes


