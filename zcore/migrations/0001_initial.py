# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Layout',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
                ('title', models.CharField(max_length=200, default='')),
                ('body', models.TextField()),
            ],
        ),
        migrations.CreateModel(
            name='StorageGraph',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
                ('title', models.CharField(max_length=200, default='граф')),
                ('layout_spring', models.TextField()),
                ('body', models.TextField()),
            ],
        ),
        migrations.AddField(
            model_name='layout',
            name='storage_graph_id',
            field=models.ForeignKey(null=True, blank=True, to='zcore.StorageGraph'),
        ),
    ]
