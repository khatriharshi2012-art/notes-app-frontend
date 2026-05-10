import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useFeedback } from "../hooks/useFeedback";
import { buildApiUrl, getAuthHeaders, readJsonResponse } from "../utils/api";
import "../App.css";

const emptyNote = { title: "", content: "" };

function Notes() {
  const { showToast, confirm } = useFeedback();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [draftNote, setDraftNote] = useState(emptyNote);
  const [editNote, setEditNote] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState(searchParams.get("filter") || "all");
  const hasFetchedRef = useRef(false);
  const search = searchParams.get("q") || "";

  const activeNote = editNote || draftNote;

  const loadNotes = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(buildApiUrl("/notes/get-note"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        showToast({
          title: "Could not load notes",
          message: data?.message || "Please try again in a moment.",
          type: "error",
        });
        setNotes([]);
        return;
      }

      setNotes(data?.data || []);
    } catch (error) {
      console.error(error);
      setNotes([]);
      showToast({
        title: "Server error",
        message: "Notes could not be loaded right now.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    const hasOpenModal = showModal || Boolean(editNote);
    document.body.classList.toggle("modal-open", hasOpenModal);

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showModal, editNote]);

  useEffect(() => {
    setFilter(searchParams.get("filter") || "all");
  }, [searchParams]);

  const closeModal = () => {
    setShowModal(false);
    setEditNote(null);
    setDraftNote(emptyNote);
  };

  const handleSaveNote = async () => {
    if (isSaving) {
      return;
    }

    if (!activeNote.title.trim() || !activeNote.content.trim()) {
      showToast({
        title: "Missing note details",
        message: "Add both a title and some content before saving.",
        type: "error",
      });
      return;
    }

    const isEditing = Boolean(editNote);
    const endpoint = isEditing ? "/notes/update-note" : "/notes/create-note";
    const payload = isEditing
      ? {
          id: editNote._id,
          title: editNote.title,
          content: editNote.content,
          isFavorite: editNote.isFavorite,
        }
      : {
          ...draftNote,
          isFavorite: false,
        };

    try {
      setIsSaving(true);

      const response = await fetch(buildApiUrl(endpoint), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        showToast({
          title: isEditing ? "Update failed" : "Save failed",
          message: data?.message || "Please try again.",
          type: "error",
        });
        return;
      }

      if (isEditing) {
        setNotes((prev) =>
          prev.map((item) => (item._id === editNote._id ? data.data : item)),
        );
      } else {
        setNotes((prev) => [data.data, ...prev]);
      }

      showToast({
        title: isEditing ? "Note updated" : "Note created",
        message: "Your changes have been saved.",
        type: "success",
      });
      closeModal();
    } catch (error) {
      console.error(error);
      showToast({
        title: "Request failed",
        message: "We could not save this note.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id) => {
    const shouldDelete = await confirm({
      title: "Delete this note?",
      message: "This note will be removed permanently.",
      confirmLabel: "Delete note",
      cancelLabel: "Keep note",
      tone: "danger",
    });

    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/notes/delete-note"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ id }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        showToast({
          title: "Delete failed",
          message: data?.message || "The note could not be removed.",
          type: "error",
        });
        return;
      }

      setNotes((prev) => prev.filter((note) => note._id !== id));
      showToast({
        title: "Note deleted",
        message: "The note has been removed.",
        type: "success",
      });
    } catch (error) {
      console.error(error);
      showToast({
        title: "Request failed",
        message: "The note could not be removed right now.",
        type: "error",
      });
    }
  };

  const toggleFavorite = async (note) => {
    try {
      const response = await fetch(buildApiUrl("/notes/update-note"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          id: note._id,
          isFavorite: !note.isFavorite,
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        showToast({
          title: "Update failed",
          message: data?.message || "Favorite status could not be changed.",
          type: "error",
        });
        return;
      }

      setNotes((prev) =>
        prev.map((item) => (item._id === note._id ? data.data : item)),
      );
    } catch (error) {
      console.error(error);
      showToast({
        title: "Update failed",
        message: "Favorite status could not be changed.",
        type: "error",
      });
    }
  };

  const openCreateModal = () => {
    setEditNote(null);
    setDraftNote(emptyNote);
    setShowModal(true);
  };

  const openEditModal = (note) => {
    setShowModal(false);
    setEditNote(note);
  };

  const filteredNotes = notes
    .filter((note) => (filter === "favorites" ? note.isFavorite : true))
    .filter((note) => {
      const query = search.toLowerCase();
      return (
        (note.title || "").toLowerCase().includes(query) ||
        (note.content || "").toLowerCase().includes(query)
      );
    });

  return (
    <section className="page-shell">
      <div className="page-header notes-header page-color">
        <div>
          <span className="page-kicker">Notes workspace</span>
          <h1>Capture ideas without losing structure.</h1>
          <p>
            Search instantly, pin favorites, and keep your writing experience
            clean on mobile and desktop.
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              const nextFilter = filter === "all" ? "favorites" : "all";
              const nextParams = new URLSearchParams(searchParams);

              setFilter(nextFilter);

              if (nextFilter === "all") {
                nextParams.delete("filter");
              } else {
                nextParams.set("filter", nextFilter);
              }

              setSearchParams(nextParams);
            }}
          >
            <i
              className={`fa-${filter === "favorites" ? "regular" : "solid"} fa-heart`}
            />
            <span>{filter === "favorites" ? "Show all" : "Favorites"}</span>
          </button>

          <button
            type="button"
            className="button button-primary"
            onClick={openCreateModal}
          >
            <i className="fa-solid fa-plus" />
            <span>New note</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="empty-panel">
          <h3>Loading notes...</h3>
          <p>We&apos;re preparing your workspace.</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="empty-panel">
          <h3>No notes found</h3>
          <p>Try a different filter or create a fresh note.</p>
        </div>
      ) : (
        <div className="notes-grid">
          {filteredNotes.map((note) => (
            <article className="note-card" key={note._id}>
              <div className="note-card-top">
                <span className="card-badge">
                  {note.isFavorite ? "Favorite" : "Note"}
                </span>
                <button
                  type="button"
                  className={`icon-button ${note.isFavorite ? "is-active" : ""}`}
                  onClick={() => toggleFavorite(note)}
                  aria-label="Toggle favorite"
                >
                  <i
                    className={`${note.isFavorite ? "fa-solid" : "fa-regular"} fa-heart`}
                  />
                </button>
              </div>

              <h3>{note.title}</h3>
              <p>{note.content}</p>

              <div className="note-actions">
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => openEditModal(note)}
                >
                  <i className="fa-regular fa-pen-to-square" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="button button-danger-soft"
                  onClick={() => handleDeleteNote(note._id)}
                >
                  <i className="fa-solid fa-trash" />
                  <span>Delete</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal || editNote ? (
        <div className="overlay-shell" role="presentation">
          <div className="modal-card" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <span className="page-kicker">
                  {editNote ? "Edit note" : "Create note"}
                </span>
                <h2>
                  {editNote ? "Refine your note" : "Write something down"}
                </h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={closeModal}
                aria-label="Close note modal"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="modal-body">
              <label className="field-group">
                <span>Title</span>
                <input
                  placeholder="Meeting recap, launch ideas, quick thoughts..."
                  value={activeNote.title}
                  onChange={(event) =>
                    editNote
                      ? setEditNote({ ...editNote, title: event.target.value })
                      : setDraftNote({
                          ...draftNote,
                          title: event.target.value,
                        })
                  }
                />
              </label>

              <label className="field-group">
                <span>Content</span>
                <textarea
                  rows="8"
                  placeholder="Add the details here..."
                  value={activeNote.content}
                  onChange={(event) =>
                    editNote
                      ? setEditNote({
                          ...editNote,
                          content: event.target.value,
                        })
                      : setDraftNote({
                          ...draftNote,
                          content: event.target.value,
                        })
                  }
                />
              </label>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="button button-secondary"
                onClick={closeModal}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={handleSaveNote}
                disabled={isSaving}
              >
                {isSaving
                  ? editNote
                    ? "Updating..."
                    : "Saving..."
                  : editNote
                    ? "Update note"
                    : "Save note"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default Notes;
