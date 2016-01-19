# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('zcore', '0002_auto_20160114_1132'),
    ]

    operations = [
        migrations.CreateModel(
            name='Layout',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('title', models.CharField(max_length=200, default='')),
                ('body', models.TextField()),
                ('storage_graph_id', models.ForeignKey(null=True, blank=True, to='zcore.StorageGraph')),
            ],
        ),
    ]
