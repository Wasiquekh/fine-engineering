"use client";

import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaTimes } from 'react-icons/fa';

interface WorkerFormModalProps {
  title: string;
  worker?: any;
  onClose: () => void;
  onSubmit: (values: any) => Promise<void>;
  isEdit?: boolean;
}

export default function WorkerFormModal({ title, worker, onClose, onSubmit, isEdit = false }: WorkerFormModalProps) {
  const initialValues = worker || {
    worker_name: '',
    mobile: '',
    password: ''
  };

  const validationSchema = Yup.object({
    worker_name: Yup.string()
      .required("Worker name is required")
      .min(2, "Worker name must be at least 2 characters"),
    mobile: Yup.string()
      .nullable()
      .matches(/^[0-9]{10}$/, "Mobile number must be 10 digits")
      .optional(),
    password: isEdit 
      ? Yup.string()
          .min(4, "Password must be at least 4 characters")
          .optional()
      : Yup.string()
          .min(4, "Password must be at least 4 characters")
          .required("Password is required"),
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-[#E7E7E7]">
          <h2 className="text-xl font-bold text-[#0A0A0A]">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
            <FaTimes size={20} />
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
                  <label className="block text-[#0A0A0A] font-medium mb-2">Worker Name</label>
                  <Field
                    type="text"
                    name="worker_name"
                    className="w-full px-4 py-3 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                    placeholder="Enter worker name"
                  />
                  <ErrorMessage name="worker_name" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label className="block text-[#0A0A0A] font-medium mb-2">Mobile Number (Optional)</label>
                  <Field
                    type="text"
                    name="mobile"
                    className="w-full px-4 py-3 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                    placeholder="Enter 10 digit mobile number"
                  />
                  <ErrorMessage name="mobile" component="div" className="text-red-500 text-sm mt-1" />
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