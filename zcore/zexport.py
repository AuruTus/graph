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
from django.forms import widgets
from django.contrib.auth.models import User
from rest_framework import serializers


from svglib.svglib import SvgRenderer
from reportlab.graphics import renderPDF
import xml.dom.minidom

# Экспортируем svg в pdf
@csrf_exempt
def export_svg(request):
    # Получаем данные с клиентской части использую переменные POST
    svg = request.POST.get("svg")
    doc = xml.dom.minidom.parseString(svg.encode( "utf-8" ))
    svg = doc.documentElement
    # Создаём новый экземпляр класса SvgRenderer
    svgRenderer = SvgRenderer()
    svgRenderer.render(svg)
    drawing = svgRenderer.finish()

    # Вместо записы исходного файла на диск мы позволяем пользователю сразу скачать его
    pdf = renderPDF.drawToString(drawing)
    response = HttpResponse(mimetype='application/pdf')
    response.write(pdf)     

    # Реализуем возможность просмотра полученного pda файла прямо в браузерном плагине
    response["Content-Disposition"]= "attachment; filename=converted.pdf"
    return response




