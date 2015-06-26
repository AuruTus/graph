# -*- coding: utf-8 -*-
from django.conf.urls import url

from . import views


urlpatterns = [
    url(r'^index/$', views.index),
    #url(r'^upload/(?P<filename>\w.+)/$', views.FileUpload.as_view()),
    url(r'^camfileupload/$', views.CamFileUpload.as_view()),
]


