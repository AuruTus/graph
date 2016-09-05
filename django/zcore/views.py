# -*- coding: utf-8 -*-

# Иерархия файлов проекта:
# views.py
# serializers.py models.py
# zdb.py zgraph.py
# zcommon.py

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
from rest_framework import generics

from .models import *
from .zdb import create_filtered_graph
from .zgraph import *
from .serializers import *

#
#
# Обработка http-запросов и привязка к html-шаблонам

# Обработка http запроса:
#  Привязка к html-шаблону отображения главной страницы index.html
def index(request):
    graphs = StorageGraph.objects.order_by('-pk')    
    graph = StorageGraph()
    context = {'graph': graph, 'graphs': graphs}
    return render(request, 'zcore/index.html', context)


# Обработка http запроса:
# Привязка к html-шаблону отображения создания нового проекта
def create_project(request, graphFilter):
    # Создание графа - многомерной проекции "семантической кучи" - с заданными атрибутами узлов
    data = create_filtered_graph(graphFilter)

    #content = {'content': data}
    #return render(request, 'content.html', content)
    return HttpResponseRedirect('/') # Переадресуем на главную страницу
    #return True


# Обработка http запроса:
# Привязка к html-шаблону отображения графа в виде круговой диаграммы
def view_chord(request, id):
    graph = get_object_or_404(StorageGraph, pk=id)
    context = {'graph': graph}
    return render(request, 'zcore/chord.html', context)


# Обработка http запроса:
# Привязка к html-шаблону отображения данных на карте
def view_map(request, gid, nid):
    graph = get_object_or_404(StorageGraph, pk=gid)
    context = {'graph': graph, 'nid': nid}
    return render(request, 'zcore/map.html', context)


# Обработка http запроса:
# Привязка к html-шаблону отображения создания нового проекта
def view_new_project(request):
    context = ''
    return render(request, 'zcore/new-project.html', context)


# Обработка http запроса:
# Привязка к html-шаблону отображения данных в виде графа - основной вид
def view_graph(request, id):
    graph = get_object_or_404(StorageGraph, pk=id)
    context = {'graph': graph}
    return render(request, 'zcore/graph.html', context)


# Обработка http запроса:
# Привязка к html-шаблону отображения графа в виде временной гистограммы
def view_timeline(request, id):
    graph = get_object_or_404(StorageGraph, pk=id)
    context = {'graph': graph}
    return render(request, 'zcore/timeline.html', context)


# Обработка http запроса:
# Для отладки: привязка к html-шаблону отображения графа методом force
def view_force_react(request, id, graphFilter):
    graph = get_object_or_404(StorageGraph, pk=id)
    #print(graphFilter)
    #jsonurl.query_string(graphFilter)
    context = {'filter': graphFilter, 'graph': graph}
    return render(request, 'zcore/force-react.html', context)


# Обработка http запроса:
# Привязка к html-шаблону отображения графа методом force средствами библиотеки D3js
def view_force_d3(request, id, graphFilter, nodesList, color):
    graph = get_object_or_404(StorageGraph, pk=id)
    context = {'graph': graph, 'filter': graphFilter, 'nodes': nodesList, 'color': color}
    return render(request, 'zcore/force-d3.html', context)

# /Обработка http-запросов и привязка к html-шаблонам
#
#


"""
class LayoutList(generics.ListCreateAPIView):
    queryset = Layout.objects.all()
    serializer_class = LayoutSerializer

class LayoutDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Layout.objects.all()
    serializer_class = LayoutSerializer
"""

