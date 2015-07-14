# -*- coding: utf-8 -*-
from django.conf.urls import url

from . import views

urlpatterns = [

    url(r'^heap-info/$', views.HeapInfo.as_view(), name='heapInfo'),
    
"""
    url(r'^$', views.index, name='index'),

    url(r'^make-petersen/$', views.make_petersen),
    url(r'^make-random/$', views.make_random),
    url(r'^make-balanced-tree/$', views.make_balanced_tree),
    url(r'^make-semantic/$', views.make_semantic),

    url(r'^view/(?P<id>[-\w]+)/$', views.view_force, name='viewForce'),

    url(r'^json-circular/(?P<id>[-\w]+)/$', views.json_circular),
    url(r'^json-spring/(?P<id>[-\w]+)/$', views.json_spring),
    url(r'^json-force/(?P<id>[-\w]+)/rs/(?P<removeStandalone>[-\w]+)/filter/(?P<attributesFilter>[-\w]+)/$', views.json_force),
    url(r'^json-chord/(?P<id>[-\w]+)/$', views.json_chord),
    url(r'^json-attributes/$', views.json_attributes),

    url(r'^semantic/$', views.json_semantic),
"""
]

