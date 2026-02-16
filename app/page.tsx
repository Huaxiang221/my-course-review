"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import Link from "next/link";

// 定义一下科目的形状 (TypeScript)
type Subject = {
  id: number;
  code: string;
  name: string;
  year: number; // 👈 改成了 number 类型，因为数据库里存的是数字
};

// 👇 这里的年份直接用数字，方便循环
const years = [1, 2, 3, 4];

export default function Home() {
  const [selectedYear, setSelectedYear] = useState(2); // 默认选中 Year 2 (随你喜欢)
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubjects() {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("year", selectedYear); // 这里会自动匹配数字类型的 year

      if (error) {
        console.error("Error fetching subjects:", error);
      } else {
        // @ts-ignore
        setSubjects(data || []);
      }
      setLoading(false);
    }

    fetchSubjects();
  }, [selectedYear]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      
      <h1 className="text-3xl font-bold text-blue-700 mb-2 mt-8">Uni Course Review 🎓</h1>
      <p className="text-gray-500 mb-8 text-sm">Real data from Supabase!</p>

      {/* Year Selector (已更新 Year 4) */}
      <div className="bg-white p-1.5 rounded-full shadow-sm mb-8 flex gap-1 border border-gray-100">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              selectedYear === year
                ? "bg-blue-600 text-white shadow-md scale-105"
                : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            }`}
          >
            Year {year}
          </button>
        ))}
      </div>

      {/* Subject List */}
      <div className="w-full max-w-md space-y-4">
        {loading ? (
          <div className="py-20 text-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
             <p className="text-gray-400 text-sm">Loading subjects...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center p-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
             <p className="text-4xl mb-3">📭</p>
             <p className="text-gray-500 font-medium">No subjects found for Year {selectedYear}.</p>
             <p className="text-xs text-gray-400 mt-1">Go add some in Supabase!</p>
          </div>
        ) : (
          subjects.map((subject) => (
            <Link
              href={`/subject/${subject.code}`}
              key={subject.id}
              className="block bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-center pl-2">
                <div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                    {subject.code}
                  </span>
                  <h3 className="text-lg font-bold text-gray-800 mt-2.5 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                    {subject.name}
                  </h3>
                </div>
                <span className="text-gray-300 text-xl group-hover:text-blue-500 group-hover:translate-x-1 transition-all">➔</span>
              </div>
            </Link>
          ))
        )}
      </div>

      <footer className="mt-12 text-gray-400 text-xs">
        © 2026 FKM Course Review
      </footer>
    </div>
  );
}