
"use client";

import {
  ArrowDown,
  ArrowUpDown,
  Building2,
  FileSpreadsheet,
  Filter,
  Printer,
  Search,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import { useState, type FormEvent } from "react";
import { confirmDelete } from "@/utils/confirmDelete";

export default function Page() {
  const columns = [
    "توقيت التعديل",
    "آخر تعديل",
    "توقيت الإضافة",
    "مدخل البيانات",
    "الجهة",
    "إجراءات",
  ];

  const [data, setData] = useState([
    {
      id: 1,
      editTime: "10:45 ص",
      lastEdit: "إسراء سليمان",
      addTime: "2026/11/20 - 09:30 ص",
      enteredBy: "أحمد محمد",
      entity: "وزارة الإسكان",
    },
    {
      id: 2,
      editTime: "12:15 م",
      lastEdit: "محمد علي",
      addTime: "2026/11/19 - 11:20 ص",
      enteredBy: "سارة أحمد",
      entity: "هيئة المجتمعات العمرانية",
    },
    {
      id: 3,
      editTime: "02:30 م",
      lastEdit: "محمود حسن",
      addTime: "2026/11/18 - 01:10 م",
      enteredBy: "إسراء سليمان",
      entity: "مديرية الإسكان",
    },
  ]);

  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<(typeof data)[number] | null>(
    null
  );
  const [isAddingEntity, setIsAddingEntity] = useState(false);
  const [editEntityName, setEditEntityName] = useState("");

  const filteredData = data.filter((item) =>
    item.entity.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: number) => {
    void confirmDelete(id, async (deleteId) => {
      setData((prev) => prev.filter((item) => item.id !== Number(deleteId)));
    });
  };

  const handleEdit = (item: (typeof data)[number]) => {
    setEditingItem(item);
    setIsAddingEntity(false);
    setEditEntityName(item.entity);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setEditEntityName("");
    setIsAddingEntity(true);
  };

  const closeEntityModal = () => {
    setEditingItem(null);
    setIsAddingEntity(false);
  };

  const handleSaveEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newEntity = editEntityName.trim();
    if ((!editingItem && !isAddingEntity) || !newEntity) return;

    if (editingItem) {
      setData((prev) =>
        prev.map((row) =>
          row.id === editingItem.id
            ? {
              ...row,
              entity: newEntity,
              editTime: new Date().toLocaleTimeString("ar-EG", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              lastEdit: "إسراء سليمان",
            }
            : row
        )
      );
    } else {
      setData((prev) => [
        {
          id: prev.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1,
          editTime: "—",
          lastEdit: "—",
          addTime: new Date().toLocaleString("ar-EG", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
          enteredBy: "إسراء سليمان",
          entity: newEntity,
        },
        ...prev,
      ]);
    }

    closeEntityModal();
  };

  return (
    <main
      dir="rtl"
      className={`data-page${filteredData.length ? " data-page--has-rows" : ""}`}
    >
      <header className="data-page__heading">
        <h1 className="data-page__title">الجهات</h1>
        <p className="data-page__breadcrumb">Dashboard / الجهات</p>
      </header>

      <div className="data-page__actions">
        <button
          type="button"
          onClick={() => window.print()}
          className="data-page__action"
        >
          <Printer size={13} />
          طباعة الجدول
        </button>

        <button type="button" disabled className="data-page__action">
          <FileSpreadsheet size={13} />
          تصدير إكسيل
        </button>
      </div>

      <section className="data-page__card">
        <div className="data-page__toolbar">
          <button type="button" onClick={handleAdd} className="data-page__add">
            إضافة جهة
          </button>

          <label className="data-page__search">
            <input
              type="search"
              placeholder="بحث في الجهات..."
              aria-label="بحث في الجهات"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={14} />
          </label>
        </div>

        <div className="data-page__table-scroll">
          <table className="data-page__table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>
                    <span className="data-page__column-label">
                      {column}
                      <ArrowUpDown size={10} />
                      <Filter size={10} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.editTime}</td>
                    <td>{item.lastEdit}</td>
                    <td>{item.addTime}</td>
                    <td>{item.enteredBy}</td>
                    <td>{item.entity}</td>

                    <td>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          title="تعديل"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          title="حذف"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="data-page__empty-cell"
                  >
                    <div className="data-page__empty">
                      <span className="data-page__empty-icon">
                        <Building2 size={22} />
                      </span>

                      <p className="data-page__empty-message">
                        لا توجد جهات مطابقة للبحث
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="data-page__footer">
          <span>عدد الجهات: {filteredData.length}</span>

          <span className="data-page__result-status">
            <ArrowDown size={12} />
            {filteredData.length > 0
              ? `عرض ${filteredData.length} جهات`
              : "لا توجد نتائج"}
          </span>
        </footer>
      </section>

      {(editingItem || isAddingEntity) && (
        <div
          className="entity-edit__overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEntityModal();
          }}
        >
          <form
            aria-labelledby="entity-edit-title"
            aria-modal="true"
            className="entity-edit__dialog"
            onSubmit={handleSaveEdit}
            role="dialog"
          >
            <header className="entity-edit__header">
              <h2 id="entity-edit-title" className="entity-edit__title">
                {editingItem ? "تعديل الجهة" : "إضافة جهة"}
              </h2>
              <button
                type="button"
                aria-label="إغلاق نافذة التعديل"
                className="entity-edit__close"
                onClick={closeEntityModal}
              >
                <X size={18} />
              </button>
            </header>

            <label htmlFor="entity-name" className="entity-edit__label">
              اسم الجهة
            </label>
            <input
              autoFocus
              id="entity-name"
              className="entity-edit__input"
              value={editEntityName}
              onChange={(event) => setEditEntityName(event.target.value)}
              required
            />

            <footer className="entity-edit__actions">
              <button
                type="button"
                className="entity-edit__cancel"
                onClick={closeEntityModal}
              >
                إلغاء
              </button>
              <button type="submit" className="entity-edit__save">
                {editingItem ? "حفظ التعديلات" : "إضافة الجهة"}
              </button>
            </footer>
          </form>
        </div>
      )}
    </main>
  );
}
