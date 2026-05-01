import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  clearAuthSession,
  buildApiUrl,
  getAuthHeaders,
  isAuthenticated,
  readJsonResponse,
} from "../utils/api";
import "../App.css";

function Notes() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [notes, setNotes] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [editNote, setEditNote] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(searchParams.get("filter") || "all");
  const hasFetchedRef = useRef(false);

  const isLoggedIn = isAuthenticated();

  const getNotes = async () => {
    setIsLoading(true);

    try {
      const res = await fetch(buildApiUrl("/notes/get-note"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      const data = await readJsonResponse(res);

      if (!res.ok) {
        alert(data?.message || "Failed to fetch notes");
        setNotes([]);
        return;
      }

      setNotes(data?.data || []);
    } catch (err) {
      console.error(err);
      setNotes([]);
      alert("Server error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    getNotes();
  }, []);

  const addNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      alert("Title and content are required");
      return;
    }

    try {
      const res = await fetch(buildApiUrl("/notes/create-note"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          ...newNote,
          isFavorite: false,
        }),
      });

      const data = await readJsonResponse(res);

      if (!res.ok) {
        alert(data?.message || "Failed to add note");
        return;
      }

      setNewNote({ title: "", content: "" });
      setShowModal(false);
      setNotes((prev) => [data.data, ...prev]);
    } catch {
      alert("Error adding note");
    }
  };

  const deleteNote = async (id) => {
    if (!window.confirm("Delete this note?")) return;

    try {
      const res = await fetch(buildApiUrl("/notes/delete-note"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ id }),
      });

      const data = await readJsonResponse(res);

      if (!res.ok) {
        alert(data?.message || "Delete failed");
        return;
      }

      setNotes((prev) => prev.filter((note) => note._id !== id));
    } catch {
      alert("Error deleting note");
    }
  };

  const updateNote = async () => {
    if (!editNote?.title?.trim() || !editNote?.content?.trim()) {
      alert("Title and content are required");
      return;
    }

    try {
      const res = await fetch(buildApiUrl("/notes/update-note"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          id: editNote._id,
          title: editNote.title,
          content: editNote.content,
          isFavorite: editNote.isFavorite,
        }),
      });

      const data = await readJsonResponse(res);

      if (!res.ok) {
        alert(data?.message || "Update failed");
        return;
      }

      setEditNote(null);
      setShowModal(false);
      setNotes((prev) =>
        prev.map((item) =>
          item._id === editNote._id ? data.data : item,
        ),
      );
    } catch {
      alert("Update error");
    }
  };

  const toggleFavorite = async (note) => {
    try {
      const res = await fetch(buildApiUrl("/notes/update-note"), {
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

      if (!res.ok) {
        return;
      }

      setNotes((prev) =>
        prev.map((item) =>
          item._id === note._id
            ? { ...item, isFavorite: !item.isFavorite }
            : item,
        ),
      );
    } catch {
      alert("Favorite error");
    }
  };

  const filteredNotes = (notes || [])
    .filter((note) => (filter === "favorites" ? note.isFavorite : true))
    .filter(
      (note) =>
        (note.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (note.content || "").toLowerCase().includes(search.toLowerCase()),
    );

  if (isLoading) {
    return (
      <div>
        <div className="topbar">
          <input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="topbar-actions">
            <button
              onClick={() => {
                const newFilter = filter === "all" ? "favorites" : "all";
                setFilter(newFilter);
                setSearchParams({ filter: newFilter });
              }}
            >
              {filter === "favorites" ? "All Notes" : "Favorites"}
            </button>

            {isLoggedIn && (
              <button onClick={() => setShowModal(true)}>+ New Note</button>
            )}

            {isLoggedIn && (
              <button
                onClick={() => {
                  clearAuthSession();
                  navigate("/", { replace: true });
                }}
              >
                Logout
              </button>
            )}
          </div>
        </div>

        <div className="notes-grid">
          <p style={{ padding: "20px" }}>Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{"paddingInline":"15px" , "paddingBlock":"10px", "margin" : 0}}>Notes</h1>
      <div className="topbar">
        <div className="search">
          <input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <i className="fa-solid fa-magnifying-glass"></i>
        </div>

        <div className="topbar-actions">
          <button
            onClick={() => {
              const newFilter = filter === "all" ? "favorites" : "all";
              setFilter(newFilter);
              setSearchParams({ filter: newFilter });
            }}
          >
            {filter === "favorites" ? (
              <i className="fa-regular fa-note-sticky"></i>
            ) : (
              <i className="fa-solid fa-bookmark"></i>
            )}
          </button>

          {isLoggedIn && (
            <button onClick={() => setShowModal(true)}>
              <i className="fa-solid fa-plus"></i> New Note
            </button>
          )}
        </div>
      </div>

      <div className="notes-grid">
        {filteredNotes.length === 0 ? (
          <p style={{ padding: "20px" }}>No notes found</p>
        ) : (
          filteredNotes.map((note) => (
            <div className="note-card" key={note._id}>
              <h3>{note.title}</h3>
              <p>{note.content}</p>

              <div className="note-actions">
                <button onClick={() => toggleFavorite(note)}>
                  {note.isFavorite ? (
                    <i className="fa-solid fa-heart"></i>
                  ) : (
                    <i className="fa-regular fa-heart"></i>
                  )}
                </button>

                <button onClick={() => setEditNote(note)}>
                  <i className="fa-regular fa-pen-to-square"></i>
                </button>

                <button onClick={() => deleteNote(note._id)}>
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {(showModal || editNote) && (
        <div className="modal">
          <div className="modal-box">
            <h2>{editNote ? "Edit Note" : "Create Note"}</h2>

            <input
              placeholder="Title"
              value={editNote ? editNote.title : newNote.title}
              onChange={(e) =>
                editNote
                  ? setEditNote({
                      ...editNote,
                      title: e.target.value,
                    })
                  : setNewNote({
                      ...newNote,
                      title: e.target.value,
                    })
              }
            />

            <textarea
              placeholder="Content"
              value={editNote ? editNote.content : newNote.content}
              onChange={(e) =>
                editNote
                  ? setEditNote({
                      ...editNote,
                      content: e.target.value,
                    })
                  : setNewNote({
                      ...newNote,
                      content: e.target.value,
                    })
              }
            />

            {editNote ? (
              <button onClick={updateNote}>Update</button>
            ) : (
              <button onClick={addNote}>Save</button>
            )}

            <button
              onClick={() => {
                setShowModal(false);
                setEditNote(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notes;
