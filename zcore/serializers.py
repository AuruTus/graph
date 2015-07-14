# -*- coding: utf-8 -*-
from django.forms import widgets
from django.contrib.auth.models import User
from rest_framework import serializers


"""
class ObrIndicatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ObrIndicator
        fields = ('pk', 'stage', 'procent')
        order_by = 'pk'


class ObrProgressSerializer(serializers.ModelSerializer):
    indicator = ObrIndicatorSerializer(many=True, read_only=True)

    class Meta:
        model = Obr
        fields = ('pk', 'status', 'statusText', 'fileData', 'indicator')


class CamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cam
        fields = ('id',
                'fileData', 
                'modelKamery',
                'dataiVremjaSjomki',
                'kolvoKadrovvRolike',
                'kolvoStrok',
                'kolvoTochekvStroke',
                'temperaturnajaShkala',
                'stepenChernoty',
                'temperaturaFona',
                'prozrachnostSredy',
                'temperaturaSredy',
                'distancijaSjomki',
                'razmerPikselja',
                'apertura',
                'fokusnoeRasstojanie',
                )
"""


