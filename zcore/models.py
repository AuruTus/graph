# -*- coding: utf-8 -*-
import json
import math
import networkx as nx
from networkx.readwrite import json_graph
from random import randint
import numpy as np
#from numpy import array
import warnings
import requests

from django.db import models
from django.db import connections
from django.http import HttpResponse, HttpResponseRedirect

#from .zgraph import *
from .zcommon import *


class StorageGraph(models.Model):
    title = models.CharField(max_length=200, default='граф')
    #layout_spring = models.TextField()
    body = models.TextField()

    def __str__(self):
        name = 'id_' + str(self.pk) + ': ' + self.title
        return name


class Layout(models.Model):
    title = models.CharField(max_length=200, default='')
    storage_graph_id = models.ForeignKey(StorageGraph, null=True, blank=True)
    body = models.TextField()

    def __str__(self):
        title = 'graph id ' + str(self.storage_graph_id) + '; layout  ' + self.title
        return title


"""
class Node(models.Model):
    id = models.PositiveIntegerField()
    data = models.CharField(max_length=500)

    class Meta:
        abstract = True
"""





