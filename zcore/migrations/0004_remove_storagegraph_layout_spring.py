# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('zcore', '0003_layout'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='storagegraph',
            name='layout_spring',
        ),
    ]
