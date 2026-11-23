import { toast } from "sonner";

export const confirmDelete = async (
    id: number | string,
    action: (id: number | string) => Promise<unknown>
) => {
    return toast.custom((toastId) => (
        <div className="rounded-sm border border-gray-200 bg-white p-3 shadow-xl">
            {/* Message */}
            <p className="text-sm leading-6 font-medium text-gray-800">
                هل أنت متأكد أنك تريد حذف هذا العنصر؟
            </p>

            {/* Actions */}
            <div className="mt-3 flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={() => toast.dismiss(toastId)}
                    className="
                        rounded-lg
                        border border-gray-200
                        bg-gray-50
                        px-2 py-1
                        text-sm font-medium text-gray-700
                        transition-all duration-200
                        hover:bg-gray-100
                        focus:outline-none
                        focus:ring-2 focus:ring-gray-200
                    "
                >
                    إلغاء
                </button>

                <button
                    type="button"
                    onClick={async () => {
                        toast.dismiss(toastId);

                        try {
                            await action(id);
                            toast.success("تم الحذف بنجاح");
                        } catch (err) {
                            console.log(err);
                        }
                    }}
                    className="
                        rounded-lg
                        bg-red-600
                        px-2 py-1
                        text-sm font-medium text-white
                        shadow-sm
                        transition-all duration-200
                        hover:bg-red-700
                        active:scale-[0.98]
                        focus:outline-none
                        focus:ring-2 focus:ring-red-200
                    "
                >
                    حذف
                </button>
            </div>
        </div>
    ));
};