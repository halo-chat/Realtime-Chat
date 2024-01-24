import { signOut } from "firebase/auth";
import { auth, storage } from "../firebase";
import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import {
  Timestamp,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { ChatContext } from "../../context/ChatContext";
import { v4 as uuid } from "uuid";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

export default function Chat() {
  const imageInputRef = useRef(null);
  const { currentUser } = useContext(AuthContext);
  const { dispatch } = useContext(ChatContext);
  const { data } = useContext(ChatContext);

  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [img, setImg] = useState(null);

  const chatSelect = (user) => {
    dispatch({ type: "CHANGE_USER", payload: user });
  };

  // console.log(currentUser, `sebelum=======++++`);

  useEffect(() => {
    let unsub;

    if (currentUser) {
      unsub = onSnapshot(doc(db, "userChats", currentUser.uid), (doc) => {
        setChats(doc.data());
      });
    }

    return () => {
      currentUser && unsub();
    };
  }, [currentUser]);

  // console.log(currentUser, `sesudah====`);

  const submitHandler = async (e) => {
    e.preventDefault();
    setUser(null);
    let username = e.target[0].value;
    const q = query(
      collection(db, "users"),
      where("displayName", "==", username)
    );
    try {
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        setUser(doc.data());
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleSelect = async () => {
    const combinedId =
      currentUser.uid > user.uid
        ? currentUser.uid + user.uid
        : user.uid + currentUser.uid;

    try {
      const res = await getDoc(doc(db, "chats", combinedId));

      if (!res.exists()) {
        await setDoc(doc(db, "chats", combinedId), { messages: [] });
        await updateDoc(doc(db, "userChats", currentUser.uid), {
          [combinedId + ".userInfo"]: {
            uid: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL,
          },
          [combinedId + ".date"]: serverTimestamp(),
        });

        await updateDoc(doc(db, "userChats", user.uid), {
          [combinedId + ".userInfo"]: {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
          },
          [combinedId + ".date"]: serverTimestamp(),
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "chats", data.chatId), (doc) => {
      doc.exists() && setMessages(doc.data().messages);
    });

    return () => {
      unsub();
    };
  }, [data.chatId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (img) {
      const imgId = uuid();
      // img.name = imgId
      setImg((prev) => ({ ...prev, name: imgId }));

      const storageRef = ref(storage, imgId);

      const uploadTask = uploadBytesResumable(storageRef, img);

      uploadTask.on(
        (error) => {
          alert(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
            await updateDoc(doc(db, "chats", data.chatId), {
              messages: arrayUnion({
                id: uuid(),
                name: currentUser.displayName,
                text: newMessage,
                senderId: currentUser.uid,
                photoURL: currentUser.photoURL,
                date: Timestamp.now(),
                img: downloadURL,
              }),
            });
          });
          // setNewMessage(() => "");
          // setImg(() => null);
          // imageInputRef.current.value = "";
        }
      );
    } else {
      await updateDoc(doc(db, "chats", data.chatId), {
        messages: arrayUnion({
          id: uuid(),
          name: currentUser.displayName,
          text: newMessage,
          senderId: currentUser.uid,
          date: Timestamp.now(),
          photoURL: currentUser.photoURL,
        }),
      });
    }

    setNewMessage("");
    setImg(null);
    imageInputRef.current.value = "";
  };

  useEffect(() => {
    if(messages.length > 0) {
      document
        .querySelector(".flex.flex-col.h-full.overflow-x-auto.mb-4")
        .scrollTo(
          0,
          document.querySelector(".flex.flex-col.h-full.overflow-x-auto.mb-4")
            .scrollHeight
        );
    }
  }, [messages]);

  if (!currentUser) {
    return <div>Loading</div>;
  }
  return (
    <>
      {/* component */}
      <div className="flex h-screen antialiased text-gray-800">
        <div className="flex flex-row h-full w-full overflow-x-hidden">
          <div className="flex flex-col py-8 pl-6 pr-2 w-64 bg-white flex-shrink-0">
            <div className="flex flex-row items-center justify-center h-12 w-full">
              <div className="flex items-center justify-center rounded-2xl text-indigo-700 bg-indigo-100 h-10 w-10">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div className="ml-2 font-bold text-2xl">QuickChat</div>
            </div>
            <div className="flex flex-col items-center bg-indigo-100 border border-gray-200 mt-4 w-full py-6 px-4 rounded-lg">
              <div className="h-20 w-20 rounded-full border overflow-hidden">
                <img
                  src={currentUser && currentUser.photoURL}
                  alt="Avatar"
                  className="h-full w-full"
                />
              </div>
              <div className="text-sm font-semibold mt-2">
                {currentUser && currentUser.displayName}
              </div>
              <div className="text-xs text-gray-500">Lead UI/UX Designer</div>
              <div className="flex flex-row items-center mt-3">
                <button
                  className="middle none center rounded-lg bg-red-500 py-3 px-6 font-sans text-xs font-bold uppercase text-white shadow-md shadow-red-500/20 transition-all hover:shadow-lg hover:shadow-red-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                  data-ripple-light="true"
                  onClick={() => {
                    signOut(auth);
                    localStorage.clear();
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
            <div className="flex flex-col mt-8">
              <div className="flex flex-row items-center justify-between text-xs">
                <span className="font-bold">Active Conversations</span>
              </div>
              {/* component */}
              {/* This is an example component */}
              <form action="" onSubmit={submitHandler}>
                <div className="pt-2 relative mx-auto text-gray-600">
                  <input
                    className="border-2 border-gray-300 bg-white h-10 px-5 pr-10 rounded-lg text-sm focus:outline-none"
                    type="search"
                    name="search"
                    placeholder="Search"
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-0 mt-5 mr-4"
                  >
                    <svg
                      className="text-gray-600 h-4 w-4 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                      xmlnsXlink="http://www.w3.org/1999/xlink"
                      version="1.1"
                      id="Capa_1"
                      x="0px"
                      y="0px"
                      viewBox="0 0 56.966 56.966"
                      style={{ enableBackground: "new 0 0 56.966 56.966" }}
                      xmlSpace="preserve"
                      width="512px"
                      height="512px"
                    >
                      <path d="M55.146,51.887L41.588,37.786c3.486-4.144,5.396-9.358,5.396-14.786c0-12.682-10.318-23-23-23s-23,10.318-23,23  s10.318,23,23,23c4.761,0,9.298-1.436,13.177-4.162l13.661,14.208c0.571,0.593,1.339,0.92,2.162,0.92  c0.779,0,1.518-0.297,2.079-0.837C56.255,54.982,56.293,53.08,55.146,51.887z M23.984,6c9.374,0,17,7.626,17,17s-7.626,17-17,17  s-17-7.626-17-17S14.61,6,23.984,6z" />
                    </svg>
                  </button>
                </div>
              </form>
              {user && (
                <div className="flex flex-col space-y-1 mt-4 -mx-2 h-auto overflow-y-auto">
                  <button
                    className="flex flex-row items-center hover:bg-gray-100 rounded-xl p-2"
                    onClick={handleSelect}
                  >
                    <div className="flex items-center justify-center h-8 w-8 bg-indigo-200 rounded-full">
                      <img
                        src={user.photoURL}
                        alt=""
                        className="flex items-center justify-center h-8 w-8 bg-indigo-200 rounded-full"
                      />
                    </div>
                    <div className="ml-2 text-sm font-semibold">
                      {user.displayName}
                    </div>
                  </button>
                </div>
              )}
            </div>
            {Object.entries(chats)?.map((chat) => {
              return (
                <div key={chat[0]}>
                  <div className="flex flex-col space-y-1 mt-4 -mx-2 h-auto overflow-y-auto">
                    <button
                      className="flex flex-row items-center hover:bg-gray-100 rounded-xl p-2"
                      onClick={() => chatSelect(chat[1].userInfo)}
                    >
                      <div className="flex items-center justify-center h-8 w-8 bg-indigo-200 rounded-full">
                        <img
                          src={chat[1].userInfo.photoURL}
                          alt=""
                          className="flex items-center justify-center h-8 w-8 bg-indigo-200 rounded-full"
                        />
                      </div>
                      <div className="ml-2 text-sm font-semibold">
                        <span>{chat[1].userInfo.displayName}</span>
                        <p>{chat[1].lastMessage?.text}</p>
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col flex-auto h-full p-6">
            <div className="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-gray-100 h-full p-4">
              <div
                ref={ref}
                className="flex flex-col h-full overflow-x-auto mb-4"
              >
                <div className="flex flex-col h-full">
                  <div className="grid grid-cols-12 gap-y-2">
                    {messages &&
                      messages.map((el, index) => {
                        // console.log(index, `======`, el.img)
                        return (
                          <div
                            key={el.id}
                            className={
                              el.senderId !== currentUser.uid
                                ? "col-start-1 col-end-8 p-3 rounded-lg"
                                : "col-start-6 col-end-13 p-3 rounded-lg"
                            }
                          >
                            <div
                              className={
                                el.senderId !== currentUser.uid
                                  ? "flex flex-row items-center"
                                  : "flex items-center justify-start flex-row-reverse"
                              }
                            >
                              {el.name}
                            </div>
                            <div
                              className={
                                el.senderId !== currentUser.uid
                                  ? "flex flex-row items-center"
                                  : "flex items-center justify-start flex-row-reverse"
                              }
                            >
                              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0">
                                {/* {console.log(el)} */}
                                <img
                                  src={el.photoURL}
                                  alt=""
                                  className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0"
                                />
                              </div>
                              <div
                                className={
                                  el.senderId !== currentUser.uid
                                    ? "relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl"
                                    : "relative mr-3 text-sm bg-indigo-100 py-2 px-4 shadow rounded-xl"
                                }
                              >
                                <div>{el.text}</div>
                                <div>
                                  <img src={el.img} alt={el.img} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
              <div className="flex flex-row items-center h-16 rounded-xl bg-white w-full px-4">
                <div>
                  <input
                    type="file"
                    className="flex items-center justify-center text-gray-400 hover:text-gray-600"
                    id="file"
                    // value={[img]}
                    ref={imageInputRef}
                    onChange={(e) => setImg(e.target.files[0])}
                  >
                    {/* <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg> */}
                  </input>
                </div>
                <div className="flex-grow ml-4">
                  <form onSubmit={handleSend}>
                    <div className="relative w-full">
                      <input
                        type="text"
                        className="flex w-full border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-10"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                      <button className="absolute flex items-center justify-center h-full w-12 right-0 top-0 text-gray-400 hover:text-gray-600">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </button>
                    </div>
                  </form>
                </div>
                <div className="ml-4">
                  <button
                    className="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white px-4 py-1 flex-shrink-0"
                    onClick={handleSend}
                  >
                    <span>Send</span>
                    <span className="ml-2">
                      <svg
                        className="w-4 h-4 transform rotate-45 -mt-px"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
