export type Permission =
    | 'manage_organization'
    | 'manage_members'
    | 'create_exam'
    | 'edit_exam'
    | 'publish_exam'
    | 'delete_exam'
    | 'monitor_exam'
    | 'grade_exam'
    | 'view_reports'
    | 'take_exam'
    | 'manage_subscription';

export const hasPermission = (userPermissions: string[], requiredPermission: Permission) => {
    return userPermissions.includes(requiredPermission);
};
