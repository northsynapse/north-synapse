                    Ask a question or start a thoughtful conversation.
                  </p>
                </div>
                <button
                  className="icon-button"
                  aria-label="Close"
                  onClick={() => setDiscussionModalOpen(false)}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="form-stack">
                <label className="field-label" htmlFor="discussion-title">
                  TITLE
                </label>
                <input
                  id="discussion-title"
                  className="input"
                  value={discussionTitle}
                  onChange={(event) => setDiscussionTitle(event.target.value)}
                  placeholder="What would you like to discuss?"
                />

                <label className="field-label" htmlFor="discussion-category">
                  CATEGORY
                </label>
                <select
                  id="discussion-category"
                  value={discussionCategory}
                  onChange={(event) =>
                    setDiscussionCategory(event.target.value)
                  }
                >
                  <option>Study Tips</option>
                  <option>Course Selection</option>
                  <option>Computer Science</option>
                  <option>School Life</option>
                  <option>General Discussion</option>
                </select>

                <label className="field-label" htmlFor="discussion-body">
                  DETAILS
                </label>
                <textarea
                  id="discussion-body"
                  className="textarea"
                  value={discussionBody}
                  onChange={(event) => setDiscussionBody(event.target.value)}
                  placeholder="Add context to help others respond."
                />

                <button
                  className="button button-primary button-wide"
                  onClick={publishDiscussion}
                  style={{ marginTop: 10 }}
                >
                  <Send size={14} /> Publish discussion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 25. 创建自习室弹窗 */}
      {roomModalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setRoomModalOpen(false);
        }}>
          <div className="modal-window">
            <div className="standard-modal">
              <div className="modal-heading">
                <div>
                  <h2>Create a study room</h2>
                  <p className="modal-subtitle">
                    Make a space to focus with other students.
                  </p>
                </div>
                <button
                  className="icon-button"
                  aria-label="Close"
                  onClick={() => setRoomModalOpen(false)}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="form-stack">
                <label className="field-label" htmlFor="room-name">
                  ROOM NAME
                </label>
                <input
                  id="room-name"
                  className="input"
                  value={roomName}
                  onChange={(event) => setRoomName(event.target.value)}
                  placeholder="e.g. Afternoon Math Focus"
                />

                <label className="field-label" htmlFor="room-subject">
                  STUDY TOPIC
                </label>
                <select
                  id="room-subject"
                  value={roomSubject}
                  onChange={(event) => setRoomSubject(event.target.value)}
                >
                  <option>General Study</option>
                  <option>Mathematics</option>
                  <option>Science</option>
                  <option>English</option>
                  <option>Computer Science</option>
                  <option>Exam Preparation</option>
                </select>

                <label className="field-label" htmlFor="room-privacy">
                  ACCESS
                </label>
                <select
                  id="room-privacy"
                  value={roomPrivacy}
                  onChange={(event) =>
                    setRoomPrivacy(event.target.value as "Public" | "Private")
                  }
                >
                  <option value="Public">Public — anyone can join</option>
                  <option value="Private">Private — invite code required</option>
                </select>

                {roomPrivacy === "Private" && (
                  <p className="modal-subtitle">
                    Private room code generation and verification will be
                    implemented with the database.
                  </p>
                )}

                <button
                  className="button button-primary button-wide"
                  onClick={createRoom}
                  style={{ marginTop: 10 }}
                >
                  <Plus size={14} /> Create room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
