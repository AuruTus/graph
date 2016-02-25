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


# Выборка соседей всех узлов графа FG с заданной глубиной
def GIncludeNeighbors(FG, BG, depth=1):
    if depth == 0:
        return FG
    else:
        depth = depth - 1
        nodes = []
        for nid in FG.nodes():
            nodes.append(nid) # Добавляем узел в отфильтрованный массив узлов
            neighbors = nx.all_neighbors(BG, nid) # Для каждого из узлов графа получаем массив его соседей
            for neighbor in neighbors:
                nodes.append(neighbor) # Добавляем каждого соседа в отфильтрованный массив узлов
        return GIncludeNeighbors(BG.subgraph(nodes), BG, depth) # Получаем рекурсивно объединённый, включающий соседние узлы, подграф


# Производим фильтрацию графа по переданным в списке nodes узлам:
def GFilterNodes(G, nodes):
    # Если список nodes содержит данные, производим фильтрацию узлов
    if nodes and len(nodes) > 0:
        nodesList = []
        for nid in nodes:
            nodesList.append(nid)
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
def GFilterTaxonomy(FG, BG, ttypes):
    # Если массив ttypes содержит данные, производим фильтрацию узлов
    if len(ttypes) > 0:
        # Преобразуем ассоциативный массив в обычный с учётом значения true
        taxonomyTids = [] # Список id терминов таксономии
        for ttype in ttypes:
            if ttypes[ttype]:
                taxonomyTids.append(int(ttype))
        nodes = []
        for node in FG.nodes(data=True): # Получаем массив узлов графа вместе с атрибутами [узлов]
            nid = int(node[0]) # id узла
            tid = node[1]['taxonomy']['tid'] # id термина таксономии узла
            if tid in taxonomyTids:
                nodes.append(nid)
        FG = BG.subgraph(nodes)

    return FG


# Оставляем в графе только те узлы, атрибут data которых совпадает с переданной строкой
def GFilterNodeData(FG, BG, data):
    #zdata = json_graph.node_link_data(GG); jsonContent = json.dumps(zdata, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False); print(jsonContent)
    data = str(data).lower() # Преобразуем полученный текст в нижний регистр
    nodes = []
    #print('nodedata',data)
    if len(data) > 0: # Если data содержит текст, производим фильтрацию узлов
        data = data.split('+')
        for node in FG.nodes(data=True):
            nid = int(node[0])
            zstr = node[1]['data'].lower()
            for chank in data:
                if chank in zstr:
                    nodes.append(nid)
        FG = BG.subgraph(nodes)

    return FG
    
# Агрегирование узлов по атрибуту data
def GJoinByNodeData(FG, joinPersons):
    if joinPersons:
        d = {}
        count = 0
        for node in FG.nodes(data=True):
            print("NODE",node)

            nid = int(node[0])
            attributes = node[1]['attributes']
            tid = node[1]['taxonomy']['tid']
            data = node[1]['data']

            if tid == 10:
                if data != '':
                    print("DATA", data)
                    nids = d.get(data)
                    if nids == None:
                        nids = []
                    nids.append(nid) 
                    d[data] = nids
        for data in d:
            nodes = d[data]
            FG = GMergeNodes(FG, nodes)

        #print('graph:\n',FG.nodes(data=True),'\n')
    return FG


# Агрегирование узлов графа различного тип по определенным параметрам
def GJoinPersons(FG, joinPersons):
    if joinPersons:
        d = {}
        count = 0
        for node in FG.nodes(data=True):
            nid = int(node[0])
            attributes = node[1]['attributes']
            for attr in attributes:
                if attr['id'] == 30:
                    surname = attr['value']
                    if surname != '':
                        print("SURNAME",surname)
                        nids = d.get(surname)
                        if nids == None:
                            nids = []
                        nids.append(nid) 
                        d[surname] = nids
        for surname in d:
            nodes = d[surname]
            FG = GMergeNodes(FG, nodes)

        #print('graph:\n',FG.nodes(data=True),'\n')
    return FG


# Объединение узлов графа, id которых переданны в списке nodes, в один новый узел. Переданные узлы при этом удаляются из графа.
def GMergeNodes(FG,nodes):
    new_node = int('10'+str(nodes[0]))
    data = FG.node[nodes[0]]
    data.update({'mergedNodes': nodes})
    data.update({'mergedCount': len(nodes)})
    FG.add_node(new_node, data)
    for n1,n2,data in FG.edges(data=True):
        if n1 in nodes:
            FG.add_edge(new_node,n2,data)
        elif n2 in nodes:
            FG.add_edge(n1,new_node,data)
    for n in nodes: # remove the merged nodes
        FG.remove_node(n)
    return FG


