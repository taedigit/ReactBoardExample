import React, { useEffect, useState } from 'react';

interface Member {
  id: number;
  name: string;
  position: string;
  birthday: string;
  nickname: string;
}

const DB_NAME = 'memberBoardDB';
const STORE_NAME = 'members';
const DB_VERSION = 1;
const PAGE_SIZE = 10;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function addMember(member: Omit<Member, 'id'>): Promise<void> {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.add(member);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

function getMembers(): Promise<Member[]> {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Member[]);
      request.onerror = () => reject(request.error);
    });
  });
}

function deleteMember(id: number): Promise<void> {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

function updateMember(member: Member): Promise<void> {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(member);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

const Board: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', position: '', birthday: '', nickname: '' });
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', position: '', birthday: '', nickname: '' });

  const loadMembers = () => {
    getMembers().then(setMembers);
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.position.trim() || !form.birthday.trim() || !form.nickname.trim()) return;
    await addMember(form);
    setForm({ name: '', position: '', birthday: '', nickname: '' });
    setShowModal(false);
    loadMembers();
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    await deleteMember(id);
    loadMembers();
  };

  // 예시 멤버 데이터
  const exampleMembers = [
    { name: '홍길동', position: '팀장', birthday: '1990-01-01', nickname: '길동이' },
    { name: '김철수', position: '개발자', birthday: '1992-03-15', nickname: '철수' },
    { name: '이영희', position: '디자이너', birthday: '1991-07-22', nickname: '영희' },
    { name: '박민수', position: '기획자', birthday: '1989-11-30', nickname: '민수' },
    { name: '최지우', position: '마케터', birthday: '1993-05-10', nickname: '지우' },
    { name: '정수빈', position: '개발자', birthday: '1994-09-18', nickname: '수빈' },
    { name: '오세훈', position: '팀원', birthday: '1995-12-25', nickname: '세훈' },
    { name: '유나영', position: '디자이너', birthday: '1990-04-02', nickname: '나영' },
    { name: '장동건', position: '개발자', birthday: '1988-08-08', nickname: '동건' },
    { name: '한가인', position: '기획자', birthday: '1992-10-20', nickname: '가인' },
  ];

  const handleAddAll = async () => {
    for (const m of exampleMembers) {
      await addMember(m);
    }
    loadMembers();
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
  const pagedMembers = members
    .slice()
    .sort((a, b) => b.id - a.id)
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePageChange = (p: number) => {
    setPage(p);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '2rem auto', padding: 24, border: '1px solid #1976d2', borderRadius: 12, background: '#f9fafd', boxShadow: '0 2px 8px #0001' }}>
      <h2 style={{ textAlign: 'center', color: '#1976d2', marginBottom: 24 }}>멤버 게시판</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 8 }}>
        <button onClick={() => setShowModal(true)} style={{ padding: '8px 20px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>멤버 등록</button>
        <button onClick={handleAddAll} style={{ padding: '8px 20px', background: '#43a047', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>모두 추가</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#e3eafc' }}>
            <th style={{ padding: 12, border: '1px solid #d0d7e2' }}>이름</th>
            <th style={{ padding: 12, border: '1px solid #d0d7e2' }}>직책</th>
            <th style={{ padding: 12, border: '1px solid #d0d7e2' }}>생일</th>
            <th style={{ padding: 12, border: '1px solid #d0d7e2' }}>별명</th>
            <th style={{ padding: 12, border: '1px solid #d0d7e2' }}>삭제</th>
          </tr>
        </thead>
        <tbody>
          {pagedMembers.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#888' }}>멤버가 없습니다.</td>
            </tr>
          ) : (
            pagedMembers.map(member => (
              <tr key={member.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 10, border: '1px solid #f0f0f0', color: '#1976d2', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setSelectedMember(member)}>
                  {member.name}
                </td>
                <td style={{ padding: 10, border: '1px solid #f0f0f0' }}>{member.position}</td>
                <td style={{ padding: 10, border: '1px solid #f0f0f0' }}>{member.birthday}</td>
                <td style={{ padding: 10, border: '1px solid #f0f0f0' }}>{member.nickname}</td>
                <td style={{ padding: 10, border: '1px solid #f0f0f0' }}>
                  <button onClick={() => handleDelete(member.id)} style={{ color: '#fff', background: '#e53935', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>삭제</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* 페이징 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 24 }}>
        <button
          onClick={() => handlePageChange(1)}
          disabled={page === 1}
          style={{ padding: '6px 12px', border: '1px solid #1976d2', borderRadius: 4, background: page === 1 ? '#eee' : '#fff', color: '#1976d2', cursor: page === 1 ? 'default' : 'pointer', fontWeight: 'bold' }}
        >
          처음
        </button>
        <button
          onClick={() => handlePageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          style={{ padding: '6px 12px', border: '1px solid #1976d2', borderRadius: 4, background: page === 1 ? '#eee' : '#fff', color: '#1976d2', cursor: page === 1 ? 'default' : 'pointer', fontWeight: 'bold' }}
        >
          이전
        </button>
        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => handlePageChange(p)}
            disabled={p === page}
            style={{
              padding: '6px 12px',
              background: p === page ? '#1976d2' : '#fff',
              color: p === page ? '#fff' : '#1976d2',
              border: '1px solid #1976d2',
              borderRadius: 4,
              cursor: p === page ? 'default' : 'pointer',
              fontWeight: p === page ? 'bold' : 'normal',
            }}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          style={{ padding: '6px 12px', border: '1px solid #1976d2', borderRadius: 4, background: page === totalPages ? '#eee' : '#fff', color: '#1976d2', cursor: page === totalPages ? 'default' : 'pointer', fontWeight: 'bold' }}
        >
          다음
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={page === totalPages}
          style={{ padding: '6px 12px', border: '1px solid #1976d2', borderRadius: 4, background: page === totalPages ? '#eee' : '#fff', color: '#1976d2', cursor: page === totalPages ? 'default' : 'pointer', fontWeight: 'bold' }}
        >
          끝
        </button>
      </div>
      {/* 등록 팝업 */}
      {showModal && (
        <div style={{
          position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: '#0006', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, minWidth: 320, boxShadow: '0 4px 24px #0002', position: 'relative' }}>
            <h3 style={{ marginBottom: 20, color: '#1976d2' }}>멤버 등록</h3>
            <form onSubmit={handleAdd}>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="이름"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d0d7e2' }}
                  required
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="직책"
                  value={form.position}
                  onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d0d7e2' }}
                  required
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="date"
                  placeholder="생일"
                  value={form.birthday}
                  onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d0d7e2' }}
                  required
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <input
                  type="text"
                  placeholder="별명"
                  value={form.nickname}
                  onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d0d7e2' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 20px', background: '#eee', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer' }}>취소</button>
                <button type="submit" style={{ padding: '8px 20px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>등록</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 상세 보기 팝업 */}
      {selectedMember && (
        <div style={{
          position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: '#0006', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, minWidth: 320, boxShadow: '0 4px 24px #0002', position: 'relative' }}>
            <h3 style={{ marginBottom: 20, color: '#1976d2' }}>멤버 상세 정보</h3>
            {editMode ? (
              <form onSubmit={async e => {
                e.preventDefault();
                if (!editForm.name.trim() || !editForm.position.trim() || !editForm.birthday.trim() || !editForm.nickname.trim()) return;
                await updateMember({ ...selectedMember, ...editForm });
                setSelectedMember({ ...selectedMember, ...editForm });
                setEditMode(false);
                loadMembers();
              }}>
                <div style={{ marginBottom: 12 }}>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d0d7e2' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <input
                    type="text"
                    value={editForm.position}
                    onChange={e => setEditForm(f => ({ ...f, position: e.target.value }))}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d0d7e2' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <input
                    type="date"
                    value={editForm.birthday}
                    onChange={e => setEditForm(f => ({ ...f, birthday: e.target.value }))}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d0d7e2' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <input
                    type="text"
                    value={editForm.nickname}
                    onChange={e => setEditForm(f => ({ ...f, nickname: e.target.value }))}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d0d7e2' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" onClick={() => setEditMode(false)} style={{ padding: '8px 20px', background: '#eee', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer' }}>취소</button>
                  <button type="submit" style={{ padding: '8px 20px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>저장</button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}><b>이름:</b> {selectedMember.name}</div>
                <div style={{ marginBottom: 12 }}><b>직책:</b> {selectedMember.position}</div>
                <div style={{ marginBottom: 12 }}><b>생일:</b> {selectedMember.birthday}</div>
                <div style={{ marginBottom: 20 }}><b>별명:</b> {selectedMember.nickname}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => { setEditForm({ name: selectedMember.name, position: selectedMember.position, birthday: selectedMember.birthday, nickname: selectedMember.nickname }); setEditMode(true); }} style={{ padding: '8px 20px', background: '#43a047', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>수정</button>
                  <button onClick={() => setSelectedMember(null)} style={{ padding: '8px 20px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>닫기</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Board; 