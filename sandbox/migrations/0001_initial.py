# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Cam',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, primary_key=True, auto_created=True)),
                ('fileData', models.FileField(null=True, blank=True, verbose_name='Файл с данными тепловой камеры', upload_to='cam')),
            ],
        ),
    ]
