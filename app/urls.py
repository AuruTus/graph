# -*- coding: utf-8 -*-
from django.conf.urls import include, url
from django.contrib import admin


urlpatterns = [
    url(r'^admin/', include(admin.site.urls)),
    url(r'^zcore/', include('zcore.urls', namespace='zcore')),
    url(r'^syscheck/', include('syscheck.urls', namespace='syscheck')),
]

urlpatterns += [
    url(r'^$', 'zcore.views.index', name='index'),
    url(r'^force/(?P<id>[-\w]+)/$', 'zcore.views.view_force', name='viewForce'),
    url(r'^chord/(?P<id>[-\w]+)/$', 'zcore.views.view_chord', name='viewChord'),

    url(r'^create-project/(?P<graphFilter>.*)/$', 'zcore.views.create_project'),

    url(r'^json-force/(?P<id>[-\w]+)/(?P<graphFilter>.*)/$', 'zcore.views.json_force', name='jsonForce'),

    url(r'^json-attributes/$', 'zcore.views.json_attributes', name='jsonAttributes'),

    #url(r'^json-chord/(?P<id>[-\w]+)/rs/(?P<removeStandalone>[-\w]+)/filter/(?P<attributesFilter>[-\w]+)/$', 'zcore.views.json_chord', name='jsonChord'),
]


