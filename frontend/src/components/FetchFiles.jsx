import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Editor } from "@monaco-editor/react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Terminal from "./Terminal";

const FetchFiles = () => {
  const { frameworkname, foldername } = useParams();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [code, setCode] = useState("");
  const [editorLanguage, setEditorLanguage] = useState("plaintext");
  const [deleted, setDeleted] = useState(false);
  const [newFileAdded, setNewFileAdded] = useState(false);
  const [newFile, setNewFile] = useState("");
  const [extensions, setExtensions] = useState([]);
  const [saved, setSaved] = useState(false);


  const navigate = useNavigate();

  //creates the files at the server
  const handleCreateFolderS3 = async () => {
    const folderName = foldername;
    const fileKeys = files.map((file) => file.key);
    try {
      const response = await axios.post("http://localhost:5000/createFolderFromS3", {
        folderName,
        files: fileKeys,
      });
 
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  // fetch files in the folder
  const fetchFiles = async () => {
    if (!foldername) {
      console.log("No folder found!!!");
    }
    try {
      const response = await axios.get(
        `http://localhost:5000/folder/${foldername}`
      );
      setFiles(response.data);
    } catch (error) {
      console.error("Error fetching the files:", error);
    }
  };

  // Get extensions of the framework
  const getExtensions = async (req, res) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/extensions/${frameworkname}`
      );
      setExtensions(response.data);
    } catch (error) {
      console.error("Error in getting extensions : ", error);
    }
  };


  useEffect(() => {
    fetchFiles();
    getExtensions();
    handleCreateFolderS3();

    const languageMap = {
      nodejs: "javascript",
      python: "python",
      cpp: "cpp",
    };
    setEditorLanguage(languageMap[frameworkname] || "plaintext");
  }, [frameworkname, deleted, newFileAdded, extensions, saved]);

  // Select file to open on editor
  const handleFileSelect = async (fileKey) => {
    setSelectedFile(fileKey);
    try {
      const response = await axios.get("http://localhost:5000/file", {
        params: { key: fileKey },
      });
      setCode(response.data);
    } catch (error) {
      console.error("Error fetching file content:", error);
    }
  };

  // save and update code
  const handleCodeChange = (value) => {
    setCode(value);
  };

  const handleUpdateCode = async () => {
    setSaved(true);
    try {
      await axios.put(`http://localhost:5000/codeUpdate`, {
        fileKey: selectedFile,
        newCode: code,
        foldername: foldername,
      });
      setSaved(false);
    } catch (error) {
      console.error("Error in Updating code : ", error);
    }
  };

  // Add a new file
  const handleAddFile = async (newFile) => {
    setNewFileAdded(false);
    console.log(foldername);
    try {
      await axios.post(
        `http://localhost:5000/addFile/${frameworkname}/${foldername}/${newFile}`
      );
      setNewFileAdded(true);
      setNewFile("");
    } catch (error) {
      console.error("Error in adding file : ", error);
    }
  };

  // Delete a file
  const handleDeleteFile = async (Key) => {
    setDeleted(false);
    try {
      await axios.delete(`http://localhost:5000/deleteFile`, {
        params: {
          fileKey: Key,
          foldername: foldername,
        },
      });
      setDeleted(true);
    } catch (error) {
      console.error("Error in deleting file", error);
    }
  };


  return (
    <div className="frameworkEditor">
      <div className="menu">
        <h3 style={{ color: "white", fontSize: "20px" }}>
          Folder : {foldername.toUpperCase()}
        </h3>
        <hr />

        <ul style={{ listStyleType: "none", padding: 0 }}>
          {files.map((file) => (
            <li key={file.key}>
              <div
                className="fileSelection"
                style={{
                  backgroundColor: selectedFile === file.key ? "#0d6096" : "",
                }}
                onClick={() => {handleFileSelect(file.key); console.log(file.key);}}
              >
                {file.key}
                <button
                  title="Delete File"
                  id="deleteFileBtn"
                  onClick={() => handleDeleteFile(file.key)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>

        <center>
          <div className="addFile">
            <input
              type="text"
              value={newFile}
              onChange={(e) => setNewFile(e.target.value)}
              placeholder="Enter file name..."
            ></input>
            <button
              id="addFileBtn"
              title="Add File"
              onClick={() => handleAddFile(newFile)}
            >
              Add
            </button>
          </div>
        </center>

        <div className="extensions">
          <h2>Extensions : </h2>
          <div className="extensionsList">
            {extensions ? (
              extensions.map((extension, index) => (
                <div className="extension" key={index}>
                  {extension}
                </div>
              ))
            ) : (
              <p>Empty...</p>
            )}
          </div>
        </div>
      </div>

      <div className="editorTerminal">
        <div className="editor">
          <div className={saved == true ? "saved" : "unsaved"}>
            <span>Saved</span>
            <p>Your code has been saved successfully :)</p>
          </div>
          <Editor
            // height="75vh"
            language={editorLanguage}
            theme="vs-dark"
            value={code}
            onChange={handleCodeChange}
          />
          <button id="saveBtn" onClick={handleUpdateCode}>
            Save
          </button>
        </div>
        <div className="terminal">
          <p>Console</p>
          <Terminal />
          <div className="output"></div>
        </div>
      </div>
    </div>
  );
};

export default FetchFiles;
