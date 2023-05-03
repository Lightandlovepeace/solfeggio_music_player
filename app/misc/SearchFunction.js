//https://dev.to/cassiolacerda/how-to-syncing-react-state-across-multiple-tabs-with-usestate-hook-4bdm

// import React, { useEffect, useState } from "react";
// import { TextInput } from "react-native";

// function SearchFunction() {
//   const [name, setName] = useState("");

//   const onStorageUpdate = (e) => {
//     const { key, newValue } = e;
//     if (key === "name") {
//       setName(newValue);
//     }
//   };

//   const handleChange = (e) => {
//     setName(e.target.value);
//     localStorage.setItem("name", e.target.value);
//   };

//   useEffect(() => {
//     setName(localStorage.getItem("name") || "");
//     window.addEventListener("storage", onStorageUpdate);
//     return () => {
//       window.removeEventListener("storage", onStorageUpdate);
//     };
//   }, []);

//   return <TextInput value={name} onChange={handleChange} />;
// }

// export default SearchFunction;
// import { useState } from "react";

// const SearchFunction = () => {
//   const [setKey, setSetKey] = useState(0);
//   setSetKey((val) => val + 1);
//   console.log(setKey);
//   return setKey;
// };

// export default SearchFunction;
