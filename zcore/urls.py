# -*- coding: utf-8 -*-
from django.conf.urls import url

from . import views

urlpatterns = [

    url(r'^heap-info/$', views.HeapInfo.as_view(), name='heapInfo'),
    
]

