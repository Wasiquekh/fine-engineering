"use client";

import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { IoCloseOutline } from 'react-icons/io5';

interface UserFormModalProps {
  title: string;
  user: any;
  roles: any[];
  onClose: () => void;
  onSubmit: (values: any) => Promise<void>;
  isEdit: boolean;
}

export default function UserFormModal({ 
  title, 
  user, 
  roles, 
  onClose, 
  onSubmit, 
  isEdit 
}: UserFormModalProps) {
  const initialValues = user || {
    name: '',
    email: '',
    mobile_number: '',
    password: '',
    roleName: ''
  };

  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    mobile_number: Yup.string()
      .matches(/^\+91\d{10}$/, "Must be in format +91XXXXXXXXXX")
      .required("Mobile number is required"),
    password: isEdit 
      ? Yup.string().min(6, "Password must be at least 6 characters").optional()
      : Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
    roleName: Yup.string().required("Role is required"),
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-[#E7E7E7]">
          <h2 className="text-xl font-bold text-[#0A0A0A]">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
            <IoCloseOutline size={24} />
          </button>
        </div>

        <div className="p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting }) => {
              await onSubmit(values);
              setSubmitting(false);
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-[#0A0A0A] font-medium mb-2">Full Name</label>
                  <Field
                    type="text"
                    name="name"
                    className="w-full px-4 py-3 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                    placeholder="Enter full name"
                  />
                  <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label className="block text-[#0A0A0A] font-medium mb-2">Email</label>
                  <Field
                    type="email"
                    name="email"
                    className="w-full px-4 py-3 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                    placeholder="Enter email"
                  />
                  <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label className="block text-[#0A0A0A] font-medium mb-2">Mobile Number</label>
                  <Field
                    type="text"
                    name="mobile_number"
                    className="w-full px-4 py-3 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                    placeholder="+91XXXXXXXXXX"
                  />
                  <ErrorMessage name="mobile_number" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label className="block text-[#0A0A0A] font-medium mb-2">
                    {isEdit ? "New Password (leave blank to keep current)" : "Password"}
                  </label>
                  <Field
                    type="password"
                    name="password"
                    className="w-full px-4 py-3 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                    placeholder={isEdit ? "Enter new password" : "Enter password"}
                  />
                  <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label className="block text-[#0A0A0A] font-medium mb-2">Role</label>
                  <Field
                    as="select"
                    name="roleName"
                    className="w-full px-4 py-3 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role: any) => (
                      <option key={role.id} value={role.name}>
                        {role.name} (Level {role.level})
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="roleName" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 border border-[#E7E7E7] rounded-lg text-[#0A0A0A] hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-primary-600 rounded-lg text-white hover:bg-primary-700 transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}