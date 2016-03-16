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
def GIncludeNeighbors(OG, BG, MG, depth=1, noSkip=True):
    print(depth,'OG',OG.nodes())
    #for nid in MG.nodes(): print('MGraph: ',nid,'>', MG.neighbors(nid))
    #print('MG in',MG.nodes())
    #print("DEPTH",depth)
    if depth == 0:
        return OG
    else:
        depth = depth - 1
        neighbors = []
        nodes = []
        #print('     FG befor include',FG.nodes())
        nodesToCheck = OG.nodes()
        for nid in nodesToCheck:
            #print("     NID",nid)
            nodes.append(nid) # Добавляем узел в отфильтрованный массив узлов
            if OG.node[nid].get('mergedNodes'):
            #if None:
                node = OG.node[nid]
                #print("MNODE",node)
                merged = node.get('mergedNodes')
                MG.add_node(nid,node)
                #print('     MNODE',MG.node[eval(nid)]))
                #print('    merged:',merged)
                # Обрабатываем массив нод, которые являются исходными для агрегированной ноды 
                for mid in merged:
                    try:
                        neighbors = nx.all_neighbors(BG, mid)
                    except: print("     Для агрегированного узла %d в базовом графе соседних узлов не найдено" % mid)
                    for neighbor in neighbors:
                        nodes.append(neighbor) # Добавляем каждого соседа в отфильтрованный массив узлов
                        #MG.add_node(nid,BG.node[neighbor])
                        #print("     nbr",BG.node[neighbor])
                        #print("     IN GRAPH",neighbor in MG)
                        if not neighbor in MG:
                            #print("     NEIGHBOR",neighbor)
                            MG.add_node(neighbor,BG.node[neighbor])
                            MG.add_edge(nid,neighbor)
                        else:
                            pass
                            #print("     -",MG.node[neighbor])
                        #nodes.append(neighbor)
                NG = BG.subgraph(nodes)
                #NG = nx.compose(MG,BG.subgraph(nodes))
                #for nid in NG.nodes(): print('Complete NGraph: ',nid,'>', NG.neighbors(nid))
                #UG = nx.union((BG.subgraph(nodes)), MG)
                #subGraph = GIncludeNeighbors(UG, BG, MG, depth, False) # Получаем рекурсивно объединённый, включающий соседние узлы, подграф
                #subGraph = GIncludeNeighborsOnce(UG, BG)
                #subGraph = UG
            else:
                try: 
                    neighbors = nx.all_neighbors(BG, nid) # Для каждого из узлов графа получаем массив его соседей
                except: print("     Для узла %d в базовом графе соседних узлов не найдено" % nid)
                for neighbor in neighbors:
                    nodes.append(neighbor) # Добавляем каждого соседа в отфильтрованный массив узлов
                NG = BG.subgraph(nodes)

            #print("     D:",depth,"> ",nodes)
            OG = nx.compose(OG,NG)
            #print("     OG nodes",OG.nodes())
            #print("     OG edges",OG.edges())
            #subGraph = OG
            subGraph = GIncludeNeighbors(OG, BG, MG, depth) # Получаем рекурсивно объединённый, включающий соседние узлы, подграф



            #subGraph = GIncludeNeighbors(BG.subgraph(nodes), BG, MG, depth) # Получаем рекурсивно объединённый, включающий соседние узлы, подграф
         
        #for nid in MG.nodes(): print('out MGraph: ',nid,'>', MG.neighbors(nid))
        #print('MG out',MG.nodes())
        #for rid in subGraph.nodes(): print('d',depth,'nid',rid,':',subGraph.node[rid]['data'],'neighbors>', subGraph.neighbors(rid))
        return subGraph

def GIncludeNeighborsOnce(FG, BG):
    neighbors = []
    nodes = []
    for nid in FG.nodes():
        neighbors = nx.all_neighbors(BG, nid) # Для каждого из узлов графа получаем массив его соседей
        for neighbor in neighbors:
            nodes.append(neighbor) # Добавляем каждого соседа в отфильтрованный массив узлов
        subGraph = BG.subgraph(nodes)

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
def GAggregatePersons(OG, BG, aggregate):
    #print('JOIN edges',FG.edges())
    if aggregate:
        d = {}
        count = 0
        for node in OG.nodes(data=True):
            nid = int(node[0])
            attributes = node[1]['attributes']
            for attr in attributes:
                if attr['id'] == 30:
                    surname = attr['value']
                    if surname != '':
                        #print("SURNAME",surname)
                        nids = d.get(surname)
                        if nids == None:
                            nids = []
                        nids.append(nid) 
                        d[surname] = nids
        for surname in d:
            nodes = d[surname]
            #print('FG2',FG.nodes(data=True))
            #print('JOIN edges',FG.edges())
            #print("EDGES",FG.neighbors(nid),
            OG = GMergeNodes(OG, BG, nodes)

        #print('graph:\n',FG.nodes(data=True),'\n')
        #print('FG2',FG.edges(data=True))
        #print("DONE JOINING")
    return OG


# Объединение узлов графа, id которых переданны в списке nodes, в один новый узел. Переданные узлы при этом удаляются из графа.
def GMergeNodes(OG, BG, nodes):
    new_node = int('10'+str(nodes[0]))
    data = OG.node[nodes[0]]
    data.update({'mergedNodes': nodes})
    data.update({'mergedCount': len(nodes)})
    OG.add_node(new_node, data)
    #BG.add_node(new_node, data)
    for n1,n2,data in OG.edges(data=True):
        if n1 in nodes:
            OG.add_edge(new_node,n2,data)
            #BG.add_edge(new_node,n2,data)
        elif n2 in nodes:
            OG.add_edge(n1,new_node,data)
            #BG.add_edge(n1,new_node,data)
    for n in nodes: # remove the merged nodes
        #print("MERGED EDGES",OG.neighbors(n))
        OG.remove_node(n)
        #BG.remove_node(n)
        #print("DONE")
    return OG


