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
def get_node_attributes(element_id):
    sql = "SELECT prpdf.name, prpdf.display, prp.str_val FROM properties as prp, propertydefs as prpdf WHERE prp.def_id=prpdf.id AND target_id=" + str(element_id)
    cursor = connections['mysql'].cursor()
    data = []

    cursor.execute(sql)
    attributes = cursor.fetchall()
    for attribute in attributes:
        data.append({'val':attribute[0],'name':attribute[1],'display':attribute[2]})

    return data


# Получение атрибутов информационного объекта вида дуга
def get_edge_attributes(element_id):
    return ''


# Добавляем узел в граф при создании многомерной проекции "семантической кучи"
def add_node_from_db(id, G, nodeData=False):

    # Проверяем, передаётся ли в функцию значение поля data:
    # eсли значение не передаётся, мы совершаем дополнительный запрос к базе данных.
    # Это необходимо когда id узла полученно каким-то другим способом.
    # Например, в результате запроса к таблице связей relations.
    if not nodeData:
        cursor = connections['mysql'].cursor()
        sql = "SELECT el.data  FROM elements as el WHERE el.id="+str(id)
        cursor.execute(sql)
        row = cursor.fetchone()
        nodeData = row[0]

    # Для каждого узла с помощью отдельной функции получаем словарь атрибутов
    nodeAttributes = get_node_attributes(id)

    # Добавляем узел в граф вместе с полученным словарём атрибутов.
    # В качестве атрибута data указываем значение поля data, 
    # в последствии, это значение будет использованно в поиске по-умолчанию
    G.add_node(id, data=nodeData, attributes=nodeAttributes)

    return True


# Для тестовых целей:
# Создание графа - многомерной проекции "семантической кучи" - первым методом
def create_graph_method_01():
    print('Create projection using method 01')
    G = nx.Graph() # Cоздаём пустой NetworkX-граф

    # Создаём объект типа cusros, который позволяет нам подключиться и работаться с базой данных,
    # содержащей данные многомерной матрицы
    cursor = connections['mysql'].cursor()

    # Формируем sql-запрос к таблице elements, содержащей информационные объекты (далее ИО).
    # Данные объекты, не имеющих связей - ent_or_rel=0 -  являются вершинами нашего графа
    sql = "SELECT el.id, el.data  FROM elements as el WHERE el.ent_or_rel=0"

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
    data = json_graph.node_link_data(G)

    # Создаём экземпляр класса Graph, для хранения структуры графа в базе данных
    graph = Graph() 

    graph.title = "Semantic" # Определяем заголовок графа
    graph.body = json.dumps(data) # Преобразуем данные в json-формат
    graph.save() # Сохраняем граф в собственную базу данных

    return True


# Для тестовых целей:
# Создание графа - многомерной проекции "семантической кучи" - вторым методом
def create_graph_method_02():
    print('Create projection using method 02')
    # Cоздаём пустой NetworkX-граф
    G = nx.Graph()

    # Устанавливаем соединение с БД, в которой хранятся семантически связанные данные
    cursor = connections['mysql'].cursor()

    sql = "SELECT rel.id, rel.arg1, rel.arg2, el.data FROM relations as rel, elements as el WHERE rel.id = el.id"

    cursor.execute(sql) # Выполняем sql-запрос
    edges = cursor.fetchall() # Получаем массив значений результата sql-запроса

    # Проходимся в цикле по всем строкам результата sql-запроса и добавляем в граф дуги.
    for edge in edges:

        # Для каждой дуги с помощью отдельной функции получаем словарь атрибутов.
        edgeAttributes = get_edge_attributes(edge[0])

        G.add_edge(edge[1], edge[2], id=edge[0], data=edge[3], attributes=edgeAttributes)
        add_node_from_db(int(edge[1]), G)
        add_node_from_db(int(edge[2]), G)

    # Средствами бибилиотеки NetworkX,
    # экспортируем граф в виде подходящeм для json-сериализации
    data = json_graph.node_link_data(G)

    # Создаём экземпляр класса Graph, для хранения структуры графа в базе данных
    graph = Graph() 

    # Определяем заголовок графа
    graph.title = "Многомерная проекция 'семантической кучи' по заданному фильтру" 

    # Преобразуем данные в json-формат
    graph.body = json.dumps(data) 

    # Сохраняем граф в собственную базу данных
    graph.save() 

    return True


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

    # В цикле проходимся по каждой строке результата запроса
    # и добавляем в граф узлы
    for node in nodes:

        filterAttributes = "'first_name', 'last_name'" 

        sql = "SELECT prpdf.name, prpdf.display, prp.str_val FROM properties as prp, propertydefs as prpdf WHERE prp.def_id=prpdf.id AND target_id=%i AND prpdf.name IN (%s)" % (node[0], filterAttributes)

        print('sql ',sql)

        # Вызываем функцию, добавляющую узел в граф, где:
        # node[0] - id узла;
        # G - граф;
        # node[1] - не обязательное поле data, которое мы используем в качестве одного из атрибутов узла;
        add_node_from_db(node[0], G, node[1])


    # Средствами бибилиотеки NetworkX,
    # экспортируем граф в виде подходящeм для json-сериализации
    data = json_graph.node_link_data(G)

    # Создаём экземпляр класса Graph, для хранения структуры графа в базе данных
    graph = Graph() 

    # Определяем заголовок графа
    graph.title = "Многомерная проекция 'семантической кучи' по заданному фильтру" 

    # Преобразуем данные в json-формат
    graph.body = json.dumps(data) 

    # Сохраняем граф в собственную базу данных
    #graph.save() 
    #print_json(graph.body)

    return graph.body


