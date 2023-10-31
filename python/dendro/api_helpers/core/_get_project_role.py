from typing import Union
from ...common.dendro_types import DendroProject


class AuthException(Exception):
    pass

def _get_project_role(project: DendroProject, user_id: Union[str, None]) -> str:
    if user_id:
        if user_id.startswith('admin|'):
            return 'admin'
        if project.ownerId == user_id:
            return 'admin'
        user = next((x for x in project.users if x.userId == user_id), None)
        if user:
            return user.role
    if project.publiclyReadable:
        return 'viewer'
    else:
        return 'none'

def _project_has_user(project: DendroProject, user_id: Union[str, None]) -> bool:
    if not user_id:
        return False
    if project.ownerId == user_id:
        return True
    user = next((x for x in project.users if x.userId == user_id), None)
    if user:
        return True
    return False

def _check_user_can_read_project(project: DendroProject, user_id: Union[str, None]):
    if not _get_project_role(project, user_id) in ['admin', 'editor', 'viewer']:
        raise AuthException('User does not have read permission for this project')

def _check_user_can_edit_project(project: DendroProject, user_id: Union[str, None]):
    if not _get_project_role(project, user_id) in ['admin', 'editor']:
        raise AuthException('User does not have edit permission for this project')

def _check_user_is_project_admin(project: DendroProject, user_id: Union[str, None]):
    if not _get_project_role(project, user_id) == 'admin':
        raise AuthException('User does not have admin permission for this project')
