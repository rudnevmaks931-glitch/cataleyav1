// pages/plans.js

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Plans() {
  const [plans, setPlans] = useState([]); // Состояние для списка тарифов
  const [userPlan, setUserPlan] = useState(null); // Состояние для выбранного тарифа пользователя
  const [loading, setLoading] = useState(true); // Индикатор загрузки
  const [error, setError] = useState(null); // Состояние для ошибок

  // Эффект для загрузки тарифов и текущего тарифа пользователя
  useEffect(() => {
    async function fetchPlans() {
      try {
        // Загружаем тарифы
        const { data, error: plansError } = await supabase
          .from("tariffs")
          .select("*");

        if (plansError) throw new Error(plansError.message);
        setPlans(data);

        // Получаем текущий тариф пользователя
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("selected_plan")
          .eq("id", supabase.auth.user().id)
          .single();

        if (profileError) throw new Error(profileError.message);
        setUserPlan(profile?.selected_plan);

      } catch (err) {
        setError("Произошла ошибка при загрузке данных. Пожалуйста, попробуйте позже.");
        console.error(err);
      } finally {
        setLoading(false); // После загрузки данных или ошибки убираем индикатор загрузки
      }
    }

    fetchPlans();
  }, []);

  // Функция для выбора тарифа
  async function selectPlan(planId) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ selected_plan: planId })
        .eq("id", supabase.auth.user().id);

      if (error) throw new Error(error.message);
      setUserPlan(planId);

    } catch (err) {
      setError("Произошла ошибка при изменении тарифа. Попробуйте снова.");
      console.error(err);
    }
  }

  // Если идет загрузка, показываем индикатор
  if (loading) {
    return <div>Загрузка...</div>;
  }

  // Если есть ошибка, показываем сообщение об ошибке
  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h1>Выберите тариф</h1>
      {plans.length === 0 ? (
        <p>Тарифы не найдены.</p>
      ) : (
        plans.map((plan) => (
          <div key={plan.id}>
            <h3>{plan.name}</h3>
            <p>{plan.description}</p>
            <p>Токенов: {plan.token_limit}</p>
            <p>Цена: {plan.price} ₽</p>
            <button onClick={() => selectPlan(plan.id)} disabled={userPlan === plan.id}>
              {userPlan === plan.id ? "Выбран" : "Выбрать"}
            </button>
          </div>
        ))
      )}
    </div>
  );
}

