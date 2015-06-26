# -*- coding: utf-8 -*-
from django.db import models


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


