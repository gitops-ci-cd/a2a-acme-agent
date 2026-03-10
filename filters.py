from jinja2.ext import Extension

def lowercase(value):
    """Convert a string to lowercase."""
    return str(value).lower()

def uppercase(value):
    """Convert a string to uppercase."""
    return str(value).upper()

def dash_to_underscore(value):
    """Convert dashes to underscores."""
    return str(value).replace('-', '_')

def skill_id_from_name(value):
    """Derive a kebab-case skill ID from the project name by stripping the '-agent' suffix."""
    name = str(value)
    if name.endswith('-agent'):
        name = name[:-6]
    return name

def skill_name_from_id(value):
    """Convert a kebab-case skill ID to a Title Case name."""
    return str(value).replace('-', ' ').title()

class CustomExtension(Extension):
    """A custom Jinja2 extension to add filters."""
    def __init__(self, environment):
        super().__init__(environment)
        environment.filters['lowercase'] = lowercase
        environment.filters['uppercase'] = uppercase
        environment.filters['dash_to_underscore'] = dash_to_underscore
        environment.filters['skill_id_from_name'] = skill_id_from_name
        environment.filters['skill_name_from_id'] = skill_name_from_id
