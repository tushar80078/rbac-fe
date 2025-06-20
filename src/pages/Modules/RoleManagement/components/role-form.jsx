import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roleFormSchema } from "../schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useGetAvailableModulesQuery,
} from "../api/role.api";
import toast from "react-hot-toast";
import { useLazyGetPermissionQuery } from "@/pages/Loading/api/loading.api";
import useUserDetails from "@/hooks/useUserDetails";

const RoleForm = ({ initialValues, onCancel, onSuccess }) => {
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const { data: modulesData } = useGetAvailableModulesQuery();

  const [resetPermissionFn] = useLazyGetPermissionQuery();
  const { data } = useUserDetails();

  const form = useForm({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      permissions: initialValues?.permissions ?? [],
    },
  });

  const { fields, append, replace } = useFieldArray({
    control: form.control,
    name: "permissions",
  });

  const isEdit = !!initialValues?.id;
  const isLoading = isCreating || isUpdating;
  const modules = modulesData?.data || [];

  // Reset form when initialValues change (for edit mode)
  useEffect(() => {
    if (initialValues) {
      form.reset({
        name: initialValues.name || "",
        description: initialValues.description || "",
        permissions: initialValues.permissions || [],
      });
    } else {
      // Reset form when initialValues is null (for create mode)
      form.reset({
        name: "",
        description: "",
        permissions: [],
      });
    }
  }, [initialValues, form]);

  // Initialize permissions for all modules
  useEffect(() => {
    if (modules.length > 0) {
      if (isEdit && initialValues?.permissions) {
        // For edit mode, use existing permissions and add any missing modules
        const existingPermissions = initialValues.permissions;
        console.log("Existing permissions:", existingPermissions);

        const allModulesPermissions = modules.map((module) => {
          const existing = existingPermissions.find((p) => p.module === module);
          console.log(`Module ${module}:`, existing);

          return existing
            ? {
                module,
                can_read: existing.can_read === 1 || existing.can_read === true,
                can_create:
                  existing.can_create === 1 || existing.can_create === true,
                can_update:
                  existing.can_update === 1 || existing.can_update === true,
                can_delete:
                  existing.can_delete === 1 || existing.can_delete === true,
              }
            : {
                module,
                can_read: false,
                can_create: false,
                can_update: false,
                can_delete: false,
              };
        });

        console.log("All modules permissions:", allModulesPermissions);
        replace(allModulesPermissions);
      } else if (!isEdit && fields.length === 0) {
        // For create mode, initialize with all modules having no permissions
        const initialPermissions = modules.map((module) => ({
          module,
          can_read: false,
          can_create: false,
          can_update: false,
          can_delete: false,
        }));
        initialPermissions.forEach((permission) => append(permission));
      }
    }
  }, [modules, isEdit, initialValues, fields.length, append, replace]);

  const onSubmit = async (formData) => {
    try {
      // Validate that at least one permission is selected
      const hasAnyPermission = formData.permissions.some(
        (permission) =>
          permission.can_read ||
          permission.can_create ||
          permission.can_update ||
          permission.can_delete
      );

      if (!hasAnyPermission) {
        toast.error("Please select at least one permission for the role!");
        return;
      }

      if (isEdit) {
        const data = await updateRole({ id: initialValues.id, data: formData });
        if (data) {
          toast.success("Role updated successfully!");
          onSuccess?.(); // Call onSuccess callback
          onCancel();
        }
      } else {
        const data = await createRole(formData);
        if (data) {
          toast.success("Role created successfully!");
          onCancel();
        }
      }
      await resetPermissionFn(
        { id: data?.user?.role_id },
        { skip: !data?.user?.role_id }
      );
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter role name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="description"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter role description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Permissions</h3>
            <span className="text-sm text-muted-foreground">
              Select at least one permission
            </span>
          </div>

          {/* Quick Permission Presets */}
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const allPermissions = fields.map((field) => ({
                  ...field,
                  can_read: true,
                  can_create: true,
                  can_update: true,
                  can_delete: true,
                }));
                replace(allPermissions);
              }}
            >
              Full Access
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const readOnlyPermissions = fields.map((field) => ({
                  ...field,
                  can_read: true,
                  can_create: false,
                  can_update: false,
                  can_delete: false,
                }));
                replace(readOnlyPermissions);
              }}
            >
              Read Only
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const noPermissions = fields.map((field) => ({
                  ...field,
                  can_read: false,
                  can_create: false,
                  can_update: false,
                  can_delete: false,
                }));
                replace(noPermissions);
              }}
            >
              Clear All
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => {
              const hasAnyPermission =
                field.can_read ||
                field.can_create ||
                field.can_update ||
                field.can_delete;

              return (
                <Card
                  key={field.id}
                  className={
                    !hasAnyPermission ? "border-orange-200 bg-orange-50/50" : ""
                  }
                >
                  <CardHeader>
                    <CardTitle className="text-base capitalize flex items-center gap-2">
                      {field.module} Module
                      {!hasAnyPermission && (
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                          No permissions
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        name={`permissions.${index}.can_read`}
                        control={form.control}
                        render={({ field }) => {
                          console.log(
                            `can_read for ${fields[index]?.module}:`,
                            field.value,
                            typeof field.value
                          );
                          return (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={
                                    field.value === true || field.value === 1
                                  }
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal">
                                  Read
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name={`permissions.${index}.can_create`}
                        control={form.control}
                        render={({ field }) => {
                          console.log(
                            `can_create for ${fields[index]?.module}:`,
                            field.value,
                            typeof field.value
                          );
                          return (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={
                                    field.value === true || field.value === 1
                                  }
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal">
                                  Create
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name={`permissions.${index}.can_update`}
                        control={form.control}
                        render={({ field }) => {
                          console.log(
                            `can_update for ${fields[index]?.module}:`,
                            field.value,
                            typeof field.value
                          );
                          return (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={
                                    field.value === true || field.value === 1
                                  }
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal">
                                  Update
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name={`permissions.${index}.can_delete`}
                        control={form.control}
                        render={({ field }) => {
                          console.log(
                            `can_delete for ${fields[index]?.module}:`,
                            field.value,
                            typeof field.value
                          );
                          return (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={
                                    field.value === true || field.value === 1
                                  }
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal">
                                  Delete
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between gap-x-2">
          {onCancel && (
            <Button
              variant={"ghost"}
              disabled={isLoading}
              onClick={() => onCancel()}
              type="button"
            >
              Cancel
            </Button>
          )}
          <Button disabled={isLoading} type="submit">
            {isEdit ? "Update Role" : "Create Role"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default RoleForm;
