from .base import (
    ContactInfo,
    EducationEntry,
    WorkExperienceEntry,
    ProjectEntry,
    SkillCategory,
    ResponsibilityEntry
)
from .classic import ClassicArabicCVSchema

# Registry للـ Schemas
SCHEMA_REGISTRY = {
    'ClassicArabicCVSchema': ClassicArabicCVSchema,
}

def get_schema_by_name(schema_name: str):
    """
    Get schema class by name
    """
    return SCHEMA_REGISTRY.get(schema_name, ClassicArabicCVSchema)

__all__ = [
    'ContactInfo',
    'EducationEntry', 
    'WorkExperienceEntry',
    'ProjectEntry',
    'SkillCategory',
    'ResponsibilityEntry',
    'ClassicArabicCVSchema',
    'get_schema_by_name',
    'SCHEMA_REGISTRY'
]