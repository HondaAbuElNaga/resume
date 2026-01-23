import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import re_path
from core.consumers import EditorConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": URLRouter([
        # هذا الرابط الذي سيتصل به الـ React
        re_path(r'ws/editor/(?P<project_id>[0-9a-f-]+)/$', EditorConsumer.as_asgi()),
    ]),
})