
emaMA@LAPTOP-76DN517M MINGW64 /d/rpma-rust (fix-fonction)
$     npm run frontend:type-check

> rpma-rust@0.1.0 frontend:type-check
> cd frontend && npm run type-check


> rpma-frontend@0.1.0 type-check
> tsc --noEmit

src/domains/admin/components/SecurityDashboard.tsx:65:36 - error TS2554: Expected 0 arguments, but got 1.

65         ipcClient.audit.getMetrics(user.token),
                                      ~~~~~~~~~~

src/domains/admin/components/SecurityDashboard.tsx:66:35 - error TS2554: Expected 0 arguments, but got 1.

66         ipcClient.audit.getAlerts(user.token),
                                     ~~~~~~~~~~

src/domains/admin/components/SecurityDashboard.tsx:90:55 - error TS2554: Expected 1 arguments, but got 2.

90       await ipcClient.audit.acknowledgeAlert(alertId, user.token);
                                                         ~~~~~~~~~~

src/domains/admin/hooks/useAdminDashboard.ts:63:61 - error TS2345: Argument of type 'string' is not assignable to parameter of type '"day" | "week" | "month" | "year" | undefined'.

63         const rawStats = await ipcClient.dashboard.getStats(user.token);
                                                               ~~~~~~~~~~

src/domains/admin/hooks/useAdminDashboard.ts:67:44 - error TS2554: Expected 0 arguments, but got 1.

67           ipcClient.admin.getDatabaseStats(user.token).catch(() => ({ size_bytes: 0 })),
                                              ~~~~~~~~~~

src/domains/admin/hooks/useAdminDashboard.ts:87:84 - error TS2554: Expected 0 arguments, but got 1.

87           const activitiesData = await ipcClient.notifications.getRecentActivities(user.token);
                                                                                      ~~~~~~~~~~

src/domains/admin/hooks/useAdminUserManagement.ts:41:56 - error TS2554: Expected 2 arguments, but got 3.

41       const result = await ipcClient.users.list(50, 0, user.token);
                                                          ~~~~~~~~~~

src/domains/admin/hooks/useAdminUserManagement.ts:57:46 - error TS2554: Expected 1 arguments, but got 2.

57       await ipcClient.users.create(userData, user.token);
                                                ~~~~~~~~~~

src/domains/admin/hooks/useAdminUserManagement.ts:73:44 - error TS2554: Expected 1 arguments, but got 2.

73       await ipcClient.users.delete(userId, user.token);
                                              ~~~~~~~~~~

src/domains/admin/hooks/useAdminUserManagement.ts:85:49 - error TS2554: Expected 1 arguments, but got 2.

85         await ipcClient.users.unbanUser(userId, user.token);
                                                   ~~~~~~~~~~

src/domains/admin/hooks/useAdminUserManagement.ts:87:47 - error TS2554: Expected 1 arguments, but got 2.

87         await ipcClient.users.banUser(userId, user.token);
                                                 ~~~~~~~~~~

src/domains/audit/services/change-log.service.ts:97:59 - error TS2554: Expected 1 arguments, but got 2.

97       const events = await ipcClient.audit.getEvents(100, token);
                                                             ~~~~~

src/domains/auth/server/services/mfa.service.ts:57:53 - error TS2554: Expected 0 arguments, but got 1.

57       const result = await ipcClient.auth.enable2FA(sessionToken);
                                                       ~~~~~~~~~~~~

src/domains/auth/server/services/mfa.service.ts:71:61 - error TS2554: Expected 2 arguments, but got 3.

71       await ipcClient.auth.verify2FASetup(request.code, [], sessionToken);
                                                               ~~~~~~~~~~~~

src/domains/auth/server/services/mfa.service.ts:80:49 - error TS2554: Expected 1 arguments, but got 2.

80       await ipcClient.auth.disable2FA(password, sessionToken);
                                                   ~~~~~~~~~~~~

src/domains/auth/server/services/mfa.service.ts:88:65 - error TS2554: Expected 0 arguments, but got 1.

88       const result = await ipcClient.auth.regenerateBackupCodes(sessionToken);
                                                                   ~~~~~~~~~~~~

src/domains/auth/server/services/mfa.service.ts:98:53 - error TS2554: Expected 0 arguments, but got 1.

98       const result = await ipcClient.auth.enable2FA(sessionToken);
                                                       ~~~~~~~~~~~~

src/domains/clients/components/ClientSelector.tsx:55:10 - error TS2554: Expected 1 arguments, but got 2.

55       }, session.token);
            ~~~~~~~~~~~~~

src/domains/clients/components/ClientSelector.tsx:85:59 - error TS2554: Expected 1 arguments, but got 2.

85         const client = await ipcClient.clients.get(value, session.token);
                                                             ~~~~~~~~~~~~~

src/domains/clients/services/client.service.ts:89:63 - error TS2554: Expected 1 arguments, but got 2.

89       const client = await ipcClient.clients.getWithTasks(id, sessionToken);
                                                                 ~~~~~~~~~~~~

src/domains/clients/services/client.service.ts:115:70 - error TS2554: Expected 1 arguments, but got 2.

115       const client = await ipcClient.clients.create(validation.data, sessionToken);
                                                                         ~~~~~~~~~~~~

src/domains/clients/services/client.service.ts:141:74 - error TS2554: Expected 2 arguments, but got 3.

141       const client = await ipcClient.clients.update(id, validation.data, sessionToken);
                                                                             ~~~~~~~~~~~~

src/domains/clients/services/client.service.ts:155:42 - error TS2554: Expected 1 arguments, but got 2.

155       await ipcClient.clients.delete(id, sessionToken);
                                             ~~~~~~~~~~~~

src/domains/clients/services/client.service.ts:169:54 - error TS2554: Expected 1 arguments, but got 2.

169       const client = await ipcClient.clients.get(id, sessionToken);
                                                         ~~~~~~~~~~~~

src/domains/clients/services/client.service.ts:188:81 - error TS2554: Expected 1 arguments, but got 2.

188            const clientListResponse = await ipcClient.clients.list(clientQuery, sessionToken);
                                                                                    ~~~~~~~~~~~~

src/domains/clients/services/client.service.ts:208:97 - error TS2554: Expected 2 arguments, but got 3.

208             const clients = await ipcClient.clients.listWithTasks(clientQuery, limitTasks || 5, sessionToken);
                                                                                                    ~~~~~~~~~~~~

src/domains/clients/services/client.service.ts:226:76 - error TS2554: Expected 1 arguments, but got 2.

226             const listResponse = await ipcClient.clients.list(clientQuery, sessionToken);
                                                                               ~~~~~~~~~~~~

src/domains/clients/services/client.service.ts:251:72 - error TS2554: Expected 2 arguments, but got 3.

251       const clients = await ipcClient.clients.search(search || '', 10, sessionToken);
                                                                           ~~~~~~~~~~~~

src/domains/clients/services/client.service.ts:267:56 - error TS2554: Expected 0 arguments, but got 1.

267         const response = await ipcClient.clients.stats(sessionToken) as unknown;
                                                           ~~~~~~~~~~~~

src/domains/documents/services/task-photo.service.ts:90:66 - error TS2554: Expected 1 arguments, but got 2.

90       const photos = await ipcClient.photos.list(params.task_id, token);
                                                                    ~~~~~

src/domains/documents/services/task-photo.service.ts:112:95 - error TS2554: Expected 3 arguments, but got 4.

112       const result = await ipcClient.photos.upload(data.task_id, uploadFile, data.photo_type, token);
                                                                                                  ~~~~~

src/domains/interventions/api/PPFWorkflowProvider.tsx:256:56 - error TS2554: Expected 1 arguments, but got 2.

256       const result = await ipcClient.tasks.get(taskId, session.token);
                                                           ~~~~~~~~~~~~~

src/domains/interventions/services/photo.service.ts:76:9 - error TS2554: Expected 3 arguments, but got 4.

76         token
           ~~~~~

src/domains/interventions/services/photo.service.ts:89:66 - error TS2554: Expected 1 arguments, but got 2.

89       const photos = await ipcClient.photos.list(interventionId, token);
                                                                    ~~~~~

src/domains/interventions/services/photo.service.ts:102:46 - error TS2554: Expected 1 arguments, but got 2.

102       await ipcClient.photos.delete(photoId, token);
                                                 ~~~~~

src/domains/interventions/services/ppf.ts:57:66 - error TS2554: Expected 1 arguments, but got 2.

57       const intervention = await ipcClient.interventions.get(id, token);
                                                                    ~~~~~

src/domains/interventions/services/ppf.ts:97:74 - error TS2554: Expected 1 arguments, but got 2.

97       const progressData = await ipcClient.interventions.getProgress(id, token);
                                                                            ~~~~~

src/domains/interventions/services/ppf.ts:113:10 - error TS2554: Expected 1 arguments, but got 2.

113       }, token);
             ~~~~~

src/domains/interventions/services/ppf.ts:145:10 - error TS2554: Expected 1 arguments, but got 2.

145       }, token);
             ~~~~~

src/domains/interventions/services/ppf.ts:159:74 - error TS2554: Expected 1 arguments, but got 2.

159       const progressData = await ipcClient.interventions.getProgress(id, token);
                                                                             ~~~~~

src/domains/interventions/services/ppf.ts:176:74 - error TS2554: Expected 1 arguments, but got 2.

176       const progressData = await ipcClient.interventions.getProgress(id, token);
                                                                             ~~~~~

src/domains/notifications/services/notifications.service.ts:39:91 - error TS2554: Expected 1 arguments, but got 2.

39     return ipcClient.notifications.initialize(config as unknown as IpcNotificationConfig, sessionToken);
                                                                                             ~~~~~~~~~~~~

src/domains/notifications/services/notifications.service.ts:46:8 - error TS2554: Expected 1 arguments, but got 2.

46     }, sessionToken);
          ~~~~~~~~~~~~

src/domains/notifications/services/notifications.service.ts:50:67 - error TS2554: Expected 2 arguments, but got 3.

50     return ipcClient.notifications.testConfig(recipient, channel, sessionToken);
                                                                     ~~~~~~~~~~~~

src/domains/notifications/services/notifications.service.ts:54:46 - error TS2554: Expected 0 arguments, but got 1.

54     return ipcClient.notifications.getStatus(sessionToken);
                                                ~~~~~~~~~~~~

src/domains/settings/components/useNotificationSettings.ts:16:65 - error TS2554: Expected 2 arguments, but got 3.

16   return ipcClient.notifications.testConfig(recipient, 'Email', sessionToken);
                                                                   ~~~~~~~~~~~~

src/domains/settings/services/configuration.service.ts:406:68 - error TS2554: Expected 1 arguments, but got 2.

406       const events = await ipcClient.audit.getEvents(_limit || 50, token);
                                                                       ~~~~~

src/domains/tasks/components/TaskActions/DelayTaskModal.tsx:33:72 - error TS2554: Expected 3 arguments, but got 4.

33       return await ipcClient.tasks.delayTask(task.id, newDate, reason, user.token);
                                                                          ~~~~~~~~~~

src/domains/tasks/components/TaskActions/EditTaskModal.tsx:53:77 - error TS2554: Expected 2 arguments, but got 3.

53       return await ipcClient.tasks.editTask(task.id, updates as JsonObject, user.token);
                                                                               ~~~~~~~~~~

src/domains/tasks/components/TaskActions/ReportIssueModal.tsx:34:95 - error TS2554: Expected 4 arguments, but got 5.

34       return await ipcClient.tasks.reportTaskIssue(task.id, issueType, severity, description, user.token);
                                                                                                 ~~~~~~~~~~

src/domains/tasks/components/TaskActions/SendMessageModal.tsx:33:83 - error TS2554: Expected 3 arguments, but got 4.

33       return await ipcClient.tasks.sendTaskMessage(task.id, message, messageType, user.token);
                                                                                     ~~~~~~~~~~

src/domains/tasks/components/TaskAttachments.tsx:20:78 - error TS2554: Expected 1 arguments, but got 2.

20         const result = await ipcClient.interventions.getActiveByTask(taskId, session.token);
                                                                                ~~~~~~~~~~~~~

src/domains/tasks/components/TaskForm/steps/CustomerStep.tsx:45:10 - error TS2554: Expected 1 arguments, but got 2.

45       }, sessionToken!);
            ~~~~~~~~~~~~~

src/domains/tasks/components/TaskForm/steps/CustomerStep.tsx:58:63 - error TS2554: Expected 1 arguments, but got 2.

58       return await ipcClient.clients.get(formData.client_id!, sessionToken!);
                                                                 ~~~~~~~~~~~~~

src/domains/tasks/components/TaskForm/TaskFormSubmission.tsx:167:66 - error TS2554: Expected 1 arguments, but got 2.

167       const createdTask = await ipcClient.tasks.create(taskData, sessionToken);
                                                                     ~~~~~~~~~~~~

src/domains/tasks/components/TaskListCard.tsx:58:51 - error TS2554: Expected 1 arguments, but got 2.

58       queryFn: () => ipcClient.tasks.get(task.id, user.token),
                                                     ~~~~~~~~~~

src/domains/tasks/components/TaskListTable.tsx:58:51 - error TS2554: Expected 1 arguments, but got 2.

58       queryFn: () => ipcClient.tasks.get(task.id, user.token),
                                                     ~~~~~~~~~~

src/domains/tasks/components/TaskManager.tsx:45:212 - error TS2554: Expected 1 arguments, but got 2.

45         ipcClient.tasks.list({ page: 1, limit: 100, status: null, technician_id: null, client_id: null, priority: null, search: null, from_date: null, to_date: null, sort_by: "created_at", sort_order: "desc"
 }, user.token),

    ~~~~~~~~~~

src/domains/tasks/components/TaskManager.tsx:46:100 - error TS2554: Expected 1 arguments, but got 2.

46         ipcClient.clients.list({ page: 1, limit: 100, sort_by: "created_at", sort_order: "desc" }, user.token),
                                                                                                      ~~~~~~~~~~

src/domains/tasks/components/TaskManager.tsx:47:93 - error TS2554: Expected 1 arguments, but got 2.

47         ipcClient.clients.list({ page: 1, limit: 100, sort_by: "name", sort_order: "asc" }, user.token),
                                                                                               ~~~~~~~~~~

src/domains/tasks/components/TaskManager.tsx:123:46 - error TS2554: Expected 1 arguments, but got 2.

123       await ipcClient.tasks.create(taskData, user.token);
                                                 ~~~~~~~~~~

src/domains/tasks/components/TaskManager.tsx:176:64 - error TS2554: Expected 2 arguments, but got 3.

176       await ipcClient.tasks.update(editingTask.id, updateData, user.token);
                                                                   ~~~~~~~~~~

src/domains/tasks/components/TaskManager.tsx:200:50 - error TS2554: Expected 1 arguments, but got 2.

200       await ipcClient.tasks.delete(taskToDelete, user.token);
                                                     ~~~~~~~~~~

src/domains/tasks/components/TaskPhotos.tsx:43:58 - error TS2554: Expected 1 arguments, but got 2.

43       return await ipcClient.photos.list(interventionId, user.token);
                                                            ~~~~~~~~~~

src/domains/tasks/components/TaskPhotos.tsx:82:9 - error TS2554: Expected 3 arguments, but got 4.

82         user.token
           ~~~~~~~~~~

src/domains/tasks/components/TaskPhotos.tsx:123:53 - error TS2554: Expected 1 arguments, but got 2.

123       return await ipcClient.photos.delete(photoId, user.token);
                                                        ~~~~~~~~~~

src/domains/tasks/services/task-history.service.ts:59:59 - error TS2554: Expected 1 arguments, but got 2.

59       const events = await ipcClient.audit.getEvents(100, token);
                                                             ~~~~~

src/domains/tasks/services/task-history.service.ts:80:64 - error TS2554: Expected 1 arguments, but got 2.

80         const task = await ipcClient.tasks.get(filters.taskId, token);
                                                                  ~~~~~

src/domains/tasks/services/task-workflow-sync.service.ts:41:55 - error TS2554: Expected 1 arguments, but got 2.

41       const task = (await ipcClient.tasks.get(taskId, sessionToken)) as TaskWithDetails | null;
                                                         ~~~~~~~~~~~~

src/domains/tasks/services/task-workflow-sync.service.ts:47:90 - error TS2554: Expected 1 arguments, but got 2.

47       const interventionResponse = await ipcClient.interventions.getActiveByTask(taskId, sessionToken) as ActiveInterventionResponse;
                                                                                            ~~~~~~~~~~~~

src/domains/tasks/services/task-workflow-sync.service.ts:60:91 - error TS2554: Expected 1 arguments, but got 2.

60       const progressResponse = await ipcClient.interventions.getProgress(intervention.id, sessionToken);
                                                                                             ~~~~~~~~~~~~

src/domains/tasks/services/task-workflow-sync.service.ts:96:60 - error TS2554: Expected 1 arguments, but got 2.

96       const tasksResponse = await ipcClient.tasks.list({}, sessionToken);
                                                              ~~~~~~~~~~~~

src/domains/tasks/services/task.api.service.ts:59:10 - error TS2554: Expected 1 arguments, but got 2.

59       }, session.token);
            ~~~~~~~~~~~~~

src/domains/tasks/services/task.api.service.ts:115:72 - error TS2554: Expected 2 arguments, but got 3.

115       const updatedTask = await ipcClient.tasks.update(id, updateData, session.token);
                                                                           ~~~~~~~~~~~~~

src/domains/tasks/services/task.api.service.ts:129:40 - error TS2554: Expected 1 arguments, but got 2.

129       await ipcClient.tasks.delete(id, session.token);
                                           ~~~~~~~~~~~~~

src/domains/users/api/useUserActions.ts:27:83 - error TS2554: Expected 1 arguments, but got 2.

27       const response = await withToken((token) => ipcClient.users.create(payload, token));
                                                                                     ~~~~~

src/domains/users/api/useUserActions.ts:36:77 - error TS2554: Expected 2 arguments, but got 3.

36         ipcClient.users.update(id, updates as unknown as UpdateUserRequest, token)
                                                                               ~~~~~

src/domains/users/api/useUserActions.ts:44:76 - error TS2554: Expected 1 arguments, but got 2.

44     const response = await withToken((token) => ipcClient.users.delete(id, token));
                                                                              ~~~~~

src/domains/users/api/useUserActions.ts:49:77 - error TS2554: Expected 1 arguments, but got 2.

49     const response = await withToken((token) => ipcClient.users.banUser(id, token));
                                                                               ~~~~~

src/domains/users/api/useUserActions.ts:54:79 - error TS2554: Expected 1 arguments, but got 2.

54     const response = await withToken((token) => ipcClient.users.unbanUser(id, token));
                                                                                 ~~~~~

src/domains/users/api/useUserActions.ts:60:44 - error TS2554: Expected 2 arguments, but got 3.

60       ipcClient.users.changeRole(id, role, token)
                                              ~~~~~

src/domains/users/api/useUsers.ts:26:66 - error TS2554: Expected 2 arguments, but got 3.

26       const response = await ipcClient.users.list(limit, offset, user.token);
                                                                    ~~~~~~~~~~

src/domains/users/server/services/auth.service.ts:49:35 - error TS2554: Expected 0 arguments, but got 1.

49       await ipcClient.auth.logout(token);
                                     ~~~~~

src/domains/users/server/services/auth.service.ts:61:57 - error TS2554: Expected 0 arguments, but got 1.

61       const data = await ipcClient.auth.validateSession(token);
                                                           ~~~~~

src/domains/users/server/services/auth.service.ts:78:74 - error TS2554: Expected 2 arguments, but got 3.

78         const data = await ipcClient.users.updateEmail(userId, newEmail, sessionToken) as UserSession;
                                                                            ~~~~~~~~~~~~

src/domains/users/server/services/auth.service.ts:97:67 - error TS2554: Expected 2 arguments, but got 3.

97         await ipcClient.users.changePassword(userId, newPassword, sessionToken);
                                                                     ~~~~~~~~~~~~

src/domains/users/server/services/auth.service.ts:111:47 - error TS2554: Expected 1 arguments, but got 2.

111         await ipcClient.users.banUser(userId, sessionToken);
                                                  ~~~~~~~~~~~~

src/domains/users/server/services/auth.service.ts:125:46 - error TS2554: Expected 1 arguments, but got 2.

125         await ipcClient.users.delete(userId, sessionToken);
                                                 ~~~~~~~~~~~~

src/domains/users/server/services/user.service.ts:44:64 - error TS2554: Expected 2 arguments, but got 3.

44       const result = await ipcClient.users.list(limit, offset, token);
                                                                  ~~~~~

src/domains/users/server/services/user.service.ts:73:52 - error TS2554: Expected 1 arguments, but got 2.

73       const result = await ipcClient.users.get(id, token);
                                                      ~~~~~

src/domains/users/server/services/user.service.ts:110:68 - error TS2554: Expected 1 arguments, but got 2.

110         const result = await ipcClient.users.create(createRequest, sessionToken);
                                                                       ~~~~~~~~~~~~

src/domains/users/server/services/user.service.ts:157:70 - error TS2554: Expected 2 arguments, but got 3.

157       const result = await ipcClient.users.update(id, updateRequest, token);
                                                                         ~~~~~

src/domains/users/server/services/user.service.ts:167:40 - error TS2554: Expected 1 arguments, but got 2.

167       await ipcClient.users.delete(id, token);
                                           ~~~~~

src/domains/users/services/technician.service.ts:43:57 - error TS2554: Expected 2 arguments, but got 3.

43       const result = await ipcClient.users.list(100, 0, token);
                                                           ~~~~~

src/domains/users/services/technician.service.ts:57:50 - error TS2554: Expected 1 arguments, but got 2.

57       const user = await ipcClient.users.get(id, token);
                                                    ~~~~~

src/domains/users/services/user.service.ts:27:64 - error TS2554: Expected 2 arguments, but got 3.

27       const result = await ipcClient.users.list(limit, offset, sessionToken);
                                                                  ~~~~~~~~~~~~

src/domains/users/services/user.service.ts:56:52 - error TS2554: Expected 1 arguments, but got 2.

56       const result = await ipcClient.users.get(id, sessionToken);
                                                      ~~~~~~~~~~~~

src/domains/users/services/user.service.ts:86:66 - error TS2554: Expected 1 arguments, but got 2.

86       const result = await ipcClient.users.create(createRequest, sessionToken);
                                                                    ~~~~~~~~~~~~

src/domains/users/services/user.service.ts:113:70 - error TS2554: Expected 2 arguments, but got 3.

113       const result = await ipcClient.users.update(id, updateRequest, sessionToken);
                                                                         ~~~~~~~~~~~~

src/domains/users/services/user.service.ts:123:40 - error TS2554: Expected 1 arguments, but got 2.

123       await ipcClient.users.delete(id, sessionToken);
                                           ~~~~~~~~~~~~

src/lib/middleware/auth.middleware.ts:28:59 - error TS2554: Expected 0 arguments, but got 1.

28     const response = await ipcClient.auth.validateSession(token) as Record<string, unknown>;
                                                             ~~~~~


Found 101 errors in 35 files.

Errors  Files
     3  src/domains/admin/components/SecurityDashboard.tsx:65
     3  src/domains/admin/hooks/useAdminDashboard.ts:63
     5  src/domains/admin/hooks/useAdminUserManagement.ts:41
     1  src/domains/audit/services/change-log.service.ts:97
     5  src/domains/auth/server/services/mfa.service.ts:57
     2  src/domains/clients/components/ClientSelector.tsx:55
    10  src/domains/clients/services/client.service.ts:89
     2  src/domains/documents/services/task-photo.service.ts:90
     1  src/domains/interventions/api/PPFWorkflowProvider.tsx:256
     3  src/domains/interventions/services/photo.service.ts:76
     6  src/domains/interventions/services/ppf.ts:57
     4  src/domains/notifications/services/notifications.service.ts:39
     1  src/domains/settings/components/useNotificationSettings.ts:16
     1  src/domains/settings/services/configuration.service.ts:406
     1  src/domains/tasks/components/TaskActions/DelayTaskModal.tsx:33
     1  src/domains/tasks/components/TaskActions/EditTaskModal.tsx:53
     1  src/domains/tasks/components/TaskActions/ReportIssueModal.tsx:34
     1  src/domains/tasks/components/TaskActions/SendMessageModal.tsx:33
     1  src/domains/tasks/components/TaskAttachments.tsx:20
     2  src/domains/tasks/components/TaskForm/steps/CustomerStep.tsx:45
     1  src/domains/tasks/components/TaskForm/TaskFormSubmission.tsx:167
     1  src/domains/tasks/components/TaskListCard.tsx:58
     1  src/domains/tasks/components/TaskListTable.tsx:58
     6  src/domains/tasks/components/TaskManager.tsx:45
     3  src/domains/tasks/components/TaskPhotos.tsx:43
     2  src/domains/tasks/services/task-history.service.ts:59
     4  src/domains/tasks/services/task-workflow-sync.service.ts:41
     3  src/domains/tasks/services/task.api.service.ts:59
     6  src/domains/users/api/useUserActions.ts:27
     1  src/domains/users/api/useUsers.ts:26
     6  src/domains/users/server/services/auth.service.ts:49
     5  src/domains/users/server/services/user.service.ts:44
     2  src/domains/users/services/technician.service.ts:43
     5  src/domains/users/services/user.service.ts:27
     1  src/lib/middleware/auth.middleware.ts:28

emaMA@LAPTOP-76DN517M MINGW64 /d/rpma-rust (fix-fonction)
$
