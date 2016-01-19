# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('zcore', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='layout',
            name='storage_graph_id',
        ),
        migrations.DeleteModel(
            name='Layout',
        ),
    ]
