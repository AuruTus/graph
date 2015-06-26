# -*- coding: utf-8 -*-
import os
import subprocess

from django.http import HttpResponse, HttpResponseRedirect


def basher(name, param):
    try:
        output = subprocess.Popen(
                    [name, param],
                    stdout=subprocess.PIPE
                ).communicate()[0]
        return str(output) 

    except Exception as e:
        return str("Ошибка при запуске скрипта: %s" % (e))


def syscheck(request):
    data = "Диагностика системы\n"

    path = os.path.realpath(__file__)
    dir = path[0:path.rfind('/')+1] + 'sh/'
    for file in os.listdir(dir):
        if file.endswith(".sh"):
            zstr = basher(dir + str(file), '').split("_")
            data += ('%s: %s\n' %  (zstr[1], zstr[2]))

    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"
    response.write(data)

    return response 


