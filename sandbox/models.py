from django.db import models


class Cam(models.Model):
    fileData = models.FileField(u"Файл с данными тепловой камеры", upload_to="cam", null=True, blank=True)

    """
    def db_for_write(self, model, **hints):
        return 'sandbox'

    def db_for_read(self, model, **hints):
        return 'sandbox'
    """
