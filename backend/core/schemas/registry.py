# backend/core/schemas/registry.py

from typing import Type
from pydantic import BaseModel
from .classic import ClassicArabicCVSchema  # تأكد إن classic.py موجود جنبه

def get_schema_class(schema_name: str) -> Type[BaseModel]:
    registry = {
        'ClassicArabicCVSchema': ClassicArabicCVSchema,
    }
    
    # لو الاسم مش موجود، نرجع القالب الافتراضي لتجنب الخطأ
    return registry.get(schema_name, ClassicArabicCVSchema)

